const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Session = require('../models/Session');
const Review = require('../models/Review');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const mongoose = require('mongoose');
const { format } = require('date-fns');

// Apply as mentor
exports.applyAsMentor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, expertise, hourlyRate } = req.body;

    // Validate required fields
    if (!bio || !expertise || !hourlyRate) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: bio, expertise, or hourlyRate'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user already has an approved or pending mentor profile
    if (user.mentorProfile && ['approved', 'pending'].includes(user.mentorProfile.status)) {
      return res.status(400).json({
        status: 'error',
        message: user.mentorProfile.status === 'approved' 
          ? 'User is already an approved mentor'
          : 'User has a pending mentor application'
      });
    }

    // Create or update mentor profile in User model
    user.mentorProfile = {
      bio,
      expertise,
      hourlyRate,
      status: 'pending',
      rating: 0,
      reviewCount: 0
    };

    // Add mentor role if not already present
    if (!user.roles.includes('mentor')) {
      user.roles.push('mentor');
    }

    // Create or update Mentor document
    let mentor = await Mentor.findOne({ user: userId });
    if (!mentor) {
      mentor = new Mentor({
        user: userId,
        bio,
        expertise,
        hourlyRate,
        status: 'pending',
        availability: {},
        education: [],
        experience: []
      });
    } else {
      mentor.bio = bio;
      mentor.expertise = expertise;
      mentor.hourlyRate = hourlyRate;
      mentor.status = 'pending';
    }

    // Save both documents
    await Promise.all([
      user.save(),
      mentor.save()
    ]);

    res.json({
      status: 'success',
      message: 'Mentor application submitted successfully',
      data: {
        mentorProfile: user.mentorProfile,
        mentor: mentor
      }
    });
  } catch (error) {
    console.error('Error applying as mentor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error submitting mentor application',
      details: error.message
    });
  }
};

// Get all mentors with advanced filtering
exports.getMentors = async (req, res) => {
  try {
    const {
      search,
      expertise,
      minRating = 0,
      maxRating = 5,
      minPrice = 0,
      maxPrice = 200,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Base query for approved mentors
    const query = {
      roles: { $in: ['mentor'] },
      'mentorProfile.status': 'approved'
    };

    console.log('Initial query:', JSON.stringify(query, null, 2));
    console.log('Request query params:', req.query);
    
    // Execute query with pagination and sorting
    const mentors = await User.find(query).select('-password');
    
    console.log('Found mentors before filtering:', mentors.length);
    if (mentors.length === 0) {
      // If no mentors found, let's check what users exist with mentor role
      const allMentorUsers = await User.find({ roles: { $in: ['mentor'] } })
        .select('roles mentorProfile');
      console.log('All users with mentor role:', 
        JSON.stringify(allMentorUsers.map(m => ({
          id: m._id,
          roles: m.roles,
          mentorProfile: m.mentorProfile
        })), null, 2)
      );
    }

    console.log('Mentor details:', mentors.map(m => ({
      id: m._id,
      roles: m.roles,
      mentorProfile: m.mentorProfile
    })));

    // Filter mentors based on price and rating
    const filteredMentors = mentors.filter(mentor => {
      const hourlyRate = mentor.mentorProfile?.hourlyRate || 0;
      const rating = mentor.mentorProfile?.rating || 0;
      
      return hourlyRate >= minPrice && 
             hourlyRate <= maxPrice &&
             rating >= minRating &&
             rating <= maxRating;
    });

    console.log('Mentors after filtering:', filteredMentors.length);

    // Format mentor data
    const formattedMentors = filteredMentors.map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      bio: user.mentorProfile?.bio || '',
      expertise: user.mentorProfile?.expertise || [],
      hourlyRate: user.mentorProfile?.hourlyRate || 0,
      rating: user.mentorProfile?.rating || 0,
      reviewCount: user.mentorProfile?.reviewCount || 0
    }));

    res.json({
      status: 'success',
      data: {
        mentors: formattedMentors,
        pagination: {
          total: filteredMentors.length,
          pages: Math.ceil(filteredMentors.length / limit),
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting mentors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting mentors',
      details: error.message
    });
  }
};

// Get recommended mentors based on user interests and history
exports.getRecommendedMentors = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's interests and past sessions
    const user = await User.findById(userId);
    const userSessions = await Session.find({ student: userId })
      .populate('mentor')
      .sort('-createdAt');

    // Extract user's interests and preferred topics
    const userInterests = user.interests || [];
    const pastSessionTopics = userSessions.map(session => session.topic);
    const preferredMentors = userSessions.map(session => session.mentor._id);

    // Build recommendation query
    const query = {
      roles: { $in: ['mentor'] },
      'mentorProfile.status': 'approved',
      _id: { $nin: preferredMentors }, // Exclude already used mentors
      $or: [
        { 'mentorProfile.expertise': { $in: userInterests } },
        { 'mentorProfile.expertise': { $in: pastSessionTopics } }
      ]
    };

    // Get recommended mentors
    const recommendedMentors = await User.find(query)
      .select('-password')
      .sort({ 'mentorProfile.rating': -1, 'mentorProfile.reviewCount': -1 })
      .limit(5);

    // Format mentor data
    const formattedMentors = recommendedMentors.map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bio: user.mentorProfile?.bio || '',
      expertise: user.mentorProfile?.expertise || [],
      hourlyRate: user.mentorProfile?.hourlyRate || 0,
      rating: user.mentorProfile?.rating || 0,
      reviewCount: user.mentorProfile?.reviewCount || 0,
      matchingInterests: user.mentorProfile?.expertise?.filter(exp => 
        userInterests.includes(exp) || pastSessionTopics.includes(exp)
      ) || []
    }));

    res.json({
      status: 'success',
      data: {
        mentors: formattedMentors
      }
    });
  } catch (error) {
    console.error('Error getting recommended mentors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting recommended mentors',
      details: error.message
    });
  }
};

// Get mentor profile
exports.getMentorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!user.isMentor) {
      return res.status(403).json({
        status: 'error',
        message: 'User is not a mentor'
      });
    }

    const mentor = await Mentor.findOne({ user: user._id });
    const userData = user.formatForClient();

    if (!mentor) {
      // Create a new Mentor document if it doesn't exist
      const newMentor = await Mentor.create({
        user: user._id,
        bio: user.mentorProfile?.bio || '',
        expertise: user.mentorProfile?.expertise || [],
        hourlyRate: user.mentorProfile?.hourlyRate || 0,
        status: user.mentorProfile?.status || 'pending',
        availability: {},
        education: [],
        experience: [],
        languages: [],
        certificates: [],
        timezone: '',
        linkedinProfile: '',
        portfolioUrl: ''
      });

      return res.json({
        status: 'success',
        data: {
          mentor: {
            ...userData,
            bio: user.mentorProfile?.bio || '',
            expertise: user.mentorProfile?.expertise || [],
            hourlyRate: user.mentorProfile?.hourlyRate || '',
            languages: newMentor.languages,
            timezone: newMentor.timezone,
            availability: newMentor.availability,
            education: newMentor.education,
            experience: newMentor.experience,
            certificates: newMentor.certificates,
            linkedinProfile: newMentor.linkedinProfile,
            portfolioUrl: newMentor.portfolioUrl,
            profileCompleted: !!user.mentorProfile?.bio && (user.mentorProfile?.expertise || []).length > 0
          }
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        mentor: {
          ...userData,
          bio: user.mentorProfile?.bio || '',
          expertise: user.mentorProfile?.expertise || [],
          hourlyRate: user.mentorProfile?.hourlyRate || '',
          languages: mentor.languages || [],
          timezone: mentor.timezone || '',
          availability: mentor.availability || {},
          education: mentor.education || [],
          experience: mentor.experience || [],
          certificates: mentor.certificates || [],
          linkedinProfile: mentor.linkedinProfile || '',
          portfolioUrl: mentor.portfolioUrl || '',
          status: user.mentorProfile?.status || 'pending',
          rating: user.mentorProfile?.rating || 0,
          reviewCount: user.mentorProfile?.reviewCount || 0,
          profileCompleted: !!user.mentorProfile?.bio && (user.mentorProfile?.expertise || []).length > 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting mentor profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting mentor profile'
    });
  }
};

// Get mentor by ID
exports.getMentorById = async (req, res) => {
  try {
    const { mentorId } = req.params;
    console.log('Looking up mentor with ID:', mentorId);

    // Find the user with mentor role
    const user = await User.findOne({
      _id: mentorId,
      roles: { $in: ['mentor'] }
    }).select('-password');

    if (!user) {
      console.log('No user found with ID and mentor role:', mentorId);
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found'
      });
    }

    console.log('Found mentor user:', user._id);

    // Get the mentor profile data
    const mentor = await Mentor.findOne({ user: user._id });
    
    if (!mentor) {
      console.log('No mentor profile found for user:', user._id);
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found'
      });
    }

    console.log('Found mentor profile:', mentor._id);

    const mentorData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      bio: user.mentorProfile?.bio || mentor.bio || '',
      expertise: user.mentorProfile?.expertise || mentor.expertise || [],
      hourlyRate: user.mentorProfile?.hourlyRate || mentor.hourlyRate || 0,
      rating: user.mentorProfile?.rating || 0,
      reviewCount: user.mentorProfile?.reviewCount || 0,
      availability: mentor.availability || {},
      education: mentor.education || [],
      experience: mentor.experience || [],
      languages: mentor.languages || [],
      timezone: mentor.timezone || '',
      certificates: mentor.certificates || [],
      linkedinProfile: mentor.linkedinProfile || '',
      portfolioUrl: mentor.portfolioUrl || ''
    };

    res.json({
      status: 'success',
      data: {
        mentor: mentorData
      }
    });
  } catch (error) {
    console.error('Error getting mentor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting mentor',
      details: error.message
    });
  }
};

// Become a mentor
exports.becomeMentor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.mentorProfile?.status) {
      return res.status(400).json({
        status: 'error',
        message: 'User has already applied to be a mentor'
      });
    }

    const { expertise, hourlyRate = 0, bio } = req.body;

    // Initialize mentor profile
    user.mentorProfile = {
      status: 'pending',
      bio: bio || '',
      expertise: expertise || [],
      hourlyRate: hourlyRate
    };

    // Add mentor role if not present
    if (!user.roles.includes('mentor')) {
      user.roles.push('mentor');
    }

    console.log('Saving user with mentor profile:', {
      roles: user.roles,
      mentorProfile: user.mentorProfile
    });

    await user.save();

    const mentor = new Mentor({
      user: user._id,
      availability: {},
      education: [],
      experience: []
    });

    await mentor.save();

    res.json({
      status: 'success',
      data: {
        mentor: {
          ...user.formatForClient(),
          availability: mentor.availability,
          education: mentor.education,
          experience: mentor.experience,
          mentorProfile: user.mentorProfile
        }
      }
    });
  } catch (error) {
    console.error('Error becoming mentor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error becoming mentor'
    });
  }
};

// Update mentor profile
exports.updateMentorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!user.roles.includes('mentor')) {
      return res.status(403).json({
        status: 'error',
        message: 'User is not a mentor'
      });
    }

    const allowedUserUpdates = [
      'expertise',
      'hourlyRate',
      'bio'
    ];
    
    const userUpdates = Object.keys(req.body)
      .filter(key => allowedUserUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    Object.assign(user, userUpdates);
    await user.save();

    let mentor = await Mentor.findOne({ user: user._id });
    
    if (!mentor) {
      mentor = new Mentor({
        user: user._id,
        availability: {},
        education: [],
        experience: []
      });
    }

    const allowedMentorUpdates = [
      'availability',
      'education',
      'experience',
      'languages',
      'timezone',
      'certificates',
      'linkedinProfile',
      'portfolioUrl'
    ];

    const mentorUpdates = Object.keys(req.body)
      .filter(key => allowedMentorUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    Object.assign(mentor, mentorUpdates);
    await mentor.save();

    res.json({
      status: 'success',
      data: {
        mentor: {
          ...user.formatForClient(),
          availability: mentor.availability,
          education: mentor.education,
          experience: mentor.experience
        }
      }
    });
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating mentor profile'
    });
  }
};

// Get mentor stats
exports.getMentorStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get sessions data
    const sessions = await Session.aggregate([
      {
        $match: {
          mentor: user._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalEarnings: { $sum: '$price' },
          uniqueStudents: { $addToSet: '$student' }
        }
      }
    ]);

    // Get reviews data
    const reviews = await Review.aggregate([
      {
        $match: {
          mentor: user._id
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Get sessions by month (for trends)
    const sessionTrends = await Session.aggregate([
      {
        $match: {
          mentor: user._id,
          status: 'completed',
          startTime: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' }
          },
          sessions: { $sum: 1 },
          earnings: { $sum: '$price' }
        }
      }
    ]);

    // Format the response
    const stats = {
      totalSessions: sessions[0]?.totalSessions || 0,
      totalEarnings: sessions[0]?.totalEarnings || 0,
      averageRating: reviews[0]?.averageRating || 0,
      totalReviews: reviews[0]?.totalReviews || 0,
      totalStudents: sessions[0]?.uniqueStudents?.length || 0,
      trends: sessionTrends.map(trend => ({
        year: trend._id.year,
        month: trend._id.month,
        sessions: trend.sessions,
        earnings: trend.earnings
      }))
    };

    res.json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Error getting mentor stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting mentor stats',
      details: error.message
    });
  }
};

// Get upcoming sessions
exports.getUpcomingSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Build query based on parameters
    const query = {
      mentor: user._id
    };

    // Add status filter if provided
    if (req.query.status) {
      query.status = { $in: Array.isArray(req.query.status) ? req.query.status : [req.query.status] };
    }

    // Add upcoming filter if requested
    if (req.query.upcoming === 'true') {
      query.startTime = { $gte: new Date() };
    }

    // Add date filter if provided
    if (req.query.date) {
      const startOfDay = new Date(req.query.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(req.query.date);
      endOfDay.setHours(23, 59, 59, 999);

      query.startTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Get sessions matching the query
    const sessions = await Session.find(query)
      .populate('mentee', 'firstName lastName avatar')
      .sort({ startTime: 1 })
      .limit(10);

    res.json({
      status: 'success',
      data: {
        sessions
      }
    });
  } catch (error) {
    console.error('Error getting upcoming sessions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting upcoming sessions',
      details: error.message
    });
  }
};

// Convert weekly schedule to availability slots
const generateAvailabilitySlots = async (mentor, startDate, numberOfWeeks = 4) => {
  try {
    console.log('Generating availability slots for mentor:', {
      mentorId: mentor._id,
      startDate: startDate,
      numberOfWeeks: numberOfWeeks,
      availability: mentor.availability
    });

    const slots = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (numberOfWeeks * 7));

    // Get existing sessions to avoid conflicts
    const existingSessions = await Session.find({
      mentor: mentor._id,
      startTime: { $gte: startDate, $lt: endDate },
      status: { $nin: ['cancelled', 'rejected'] }
    });

    console.log('Existing sessions:', existingSessions);

    // Get existing slots to avoid duplicates
    const existingSlots = await AvailabilitySlot.find({
      mentor: mentor._id,
      date: { $gte: startDate, $lt: endDate }
    });

    console.log('Existing slots:', existingSlots);

    const existingSlotKeys = new Set(
      existingSlots.map(slot => 
        `${slot.date.toISOString().split('T')[0]}-${slot.startTime}-${slot.endTime}`
      )
    );

    if (!mentor.availability) {
      console.log('No availability data found for mentor');
      return [];
    }

    // Iterate through each day for the next few weeks
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const daySchedule = mentor.availability[dayName];

      console.log('Processing day:', {
        date: currentDate.toISOString(),
        dayName: dayName,
        available: daySchedule?.available,
        slots: daySchedule?.slots
      });

      if (daySchedule && daySchedule.available && daySchedule.slots) {
        for (const slot of daySchedule.slots) {
          const slotKey = `${currentDate.toISOString().split('T')[0]}-${slot.startTime}-${slot.endTime}`;
          
          // Skip if slot already exists
          if (existingSlotKeys.has(slotKey)) {
            console.log('Skipping existing slot:', slotKey);
            continue;
          }

          // Check for session conflicts
          const slotDate = new Date(currentDate);
          const [startHour, startMin] = slot.startTime.split(':').map(Number);
          const [endHour, endMin] = slot.endTime.split(':').map(Number);
          
          const slotStart = new Date(slotDate);
          slotStart.setHours(startHour, startMin, 0, 0);
          
          const slotEnd = new Date(slotDate);
          slotEnd.setHours(endHour, endMin, 0, 0);

          const hasConflict = existingSessions.some(session => {
            const sessionEnd = new Date(session.startTime);
            sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration);
            
            return (session.startTime >= slotStart && session.startTime < slotEnd) ||
                   (sessionEnd > slotStart && sessionEnd <= slotEnd) ||
                   (session.startTime <= slotStart && sessionEnd >= slotEnd);
          });

          if (!hasConflict) {
            console.log('Adding new slot:', {
              date: currentDate,
              startTime: slot.startTime,
              endTime: slot.endTime
            });
            
            slots.push({
              mentor: mentor._id,
              date: new Date(currentDate),
              startTime: slot.startTime,
              endTime: slot.endTime,
              isWeeklySlot: true
            });
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Generated new slots:', slots);

    // Delete existing slots first
    await AvailabilitySlot.deleteMany({
      mentor: mentor._id,
      date: { $gte: startDate, $lt: endDate }
    });

    // Bulk insert new slots
    if (slots.length > 0) {
      await AvailabilitySlot.insertMany(slots);
      console.log('Successfully inserted new slots');
    }

    return slots;
  } catch (error) {
    console.error('Error generating availability slots:', error);
    throw error;
  }
};

// Modify getAvailability to include slots from weekly schedule
exports.getAvailability = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const dateStr = req.query.date;

    if (!dateStr) {
      return res.status(400).json({
        status: 'error',
        message: 'Date parameter is required'
      });
    }

    if (!mentorId) {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor ID is required'
      });
    }

    // Parse the date and set to start/end of day in UTC
    const date = new Date(dateStr);
    date.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    console.log('Getting availability for:', {
      mentorId,
      date: date.toISOString(),
      endDate: endDate.toISOString()
    });

    // First find the user to ensure they are a mentor
    const user = await User.findOne({
      _id: mentorId,
      roles: { $in: ['mentor'] }
    }).select('-password');

    if (!user) {
      console.log('Mentor user not found:', mentorId);
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found'
      });
    }

    // Get mentor's availability settings
    const mentor = await Mentor.findOne({ user: mentorId });
    if (!mentor) {
      console.log('Mentor profile not found:', mentorId);
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found'
      });
    }

    // Get the day name (lowercase)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = mentor.availability?.[dayName];

    console.log('Day schedule:', {
      dayName,
      available: daySchedule?.available,
      slots: daySchedule?.slots
    });

    // Get existing slots for this day
    const existingSlots = await AvailabilitySlot.find({
      mentor: mentorId,
      date: {
        $gte: date,
        $lt: endDate
      }
    }).sort({ startTime: 1 });

    console.log('Found existing slots:', existingSlots);

    // Get booked sessions for this day
    const bookedSessions = await Session.find({
      mentor: mentorId,
      startTime: {
        $gte: date,
        $lt: endDate
      },
      status: { $nin: ['cancelled', 'rejected'] }
    });

    console.log('Found booked sessions:', bookedSessions);

    // If we have explicit slots for this day, use those
    let availableSlots = [];
    if (existingSlots.length > 0) {
      availableSlots = existingSlots.map(slot => ({
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: slot.date
      }));
    }
    // Otherwise, if the day is available in the weekly schedule, use those slots
    else if (daySchedule?.available && daySchedule?.slots?.length > 0) {
      availableSlots = daySchedule.slots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: date
      }));
    }

    console.log('Initial available slots:', availableSlots);

    // Get all slots, including original and split slots
    let processedSlots = [];

    // Process each original slot
    availableSlots.forEach(slot => {
      const slotStart = new Date(date);
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      slotStart.setUTCHours(startHour, startMin, 0, 0);

      const slotEnd = new Date(date);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      slotEnd.setUTCHours(endHour, endMin, 0, 0);

      // Calculate slot duration in minutes
      const slotDuration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      // Track split slots for this original slot
      let splitSlots = [];
      let hasAnyConflict = false;

      // Check if this slot overlaps with any booked session
      bookedSessions.forEach(session => {
        const sessionStart = new Date(session.startTime);
        const sessionEnd = new Date(sessionStart);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration);

        console.log('Checking conflict:', {
          slotStart: slotStart.toISOString(),
          slotEnd: slotEnd.toISOString(),
          sessionStart: sessionStart.toISOString(),
          sessionEnd: sessionEnd.toISOString(),
          duration: session.duration
        });

        // Check if there's an overlap
        if (sessionStart < slotEnd && sessionEnd > slotStart) {
          hasAnyConflict = true;
          console.log('Found conflict with session:', session._id);

          // Calculate remaining time before and after the session
          const timeBeforeSession = sessionStart.getTime() - slotStart.getTime();
          const timeAfterSession = slotEnd.getTime() - sessionEnd.getTime();

          // If there's enough time before the session (30 min or more)
          if (timeBeforeSession >= 30 * 60 * 1000) {
            splitSlots.push({
              startTime: format(slotStart, 'HH:mm'),
              endTime: format(sessionStart, 'HH:mm'),
              date: date
            });
          }

          // If there's enough time after the session (30 min or more)
          if (timeAfterSession >= 30 * 60 * 1000) {
            splitSlots.push({
              startTime: format(sessionEnd, 'HH:mm'),
              endTime: format(slotEnd, 'HH:mm'),
              date: date
            });
          }
        }
      });

      if (hasAnyConflict) {
        // Add available durations to each split slot
        splitSlots.forEach(splitSlot => {
          const [splitStartHour, splitStartMin] = splitSlot.startTime.split(':').map(Number);
          const [splitEndHour, splitEndMin] = splitSlot.endTime.split(':').map(Number);
          const splitDuration = (splitEndHour * 60 + splitEndMin) - (splitStartHour * 60 + splitStartMin);

          const availableDurations = [];
          if (splitDuration >= 30) availableDurations.push(30);
          if (splitDuration >= 60) availableDurations.push(60);
          if (splitDuration >= 120) availableDurations.push(120);

          splitSlot.availableDurations = availableDurations;
          processedSlots.push(splitSlot);
        });
      } else {
        // If no conflicts, add the original slot with its durations
        const availableDurations = [];
        if (slotDuration >= 30) availableDurations.push(30);
        if (slotDuration >= 60) availableDurations.push(60);
        if (slotDuration >= 120) availableDurations.push(120);

        processedSlots.push({
          ...slot,
          availableDurations
        });
      }
    });

    // Sort all slots by start time
    processedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    console.log('Final processed slots:', processedSlots);

    res.json({
      status: 'success',
      data: {
        slots: processedSlots
      }
    });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting availability'
    });
  }
};

// Add availability slot
exports.addAvailability = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { date, startTime, endTime, recurring, numberOfWeeks } = req.body;

    // Enhanced input validation
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: date, startTime, and endTime are required'
      });
    }

    // Parse and validate the date
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0); // Normalize to start of day
    
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format. Please use YYYY-MM-DD format'
      });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid time format. Please use HH:mm format (e.g., 09:00)'
      });
    }

    if (recurring && (!numberOfWeeks || numberOfWeeks < 1 || numberOfWeeks > 12)) {
      return res.status(400).json({
        status: 'error',
        message: 'For recurring slots, number of weeks must be between 1 and 12'
      });
    }

    // Check if the authenticated user is the mentor
    console.log('Comparing mentorId:', mentorId, 'with user._id:', req.user._id);
    if (mentorId !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only add availability slots for yourself'
      });
    }

    // Check if user is a mentor
    const user = await User.findOne({
      _id: mentorId,
      roles: { $in: ['mentor'] }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found'
      });
    }

    // Get mentor profile
    const mentor = await Mentor.findOne({ user: mentorId });
    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found'
      });
    }

    // Compare times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        status: 'error',
        message: 'End time must be after start time'
      });
    }

    if (endMinutes - startMinutes < 30) {
      return res.status(400).json({
        status: 'error',
        message: 'Time slot must be at least 30 minutes long'
      });
    }

    // Calculate all dates for recurring slots
    const dates = [parsedDate];
    if (recurring) {
      for (let i = 1; i < numberOfWeeks; i++) {
        const nextDate = new Date(parsedDate);
        nextDate.setDate(nextDate.getDate() + (i * 7));
        dates.push(nextDate);
      }
    }

    // Check for overlapping slots for all dates
    for (const slotDate of dates) {
      // Create Date objects for the new slot's time range
      const newSlotStart = new Date(slotDate);
      const newSlotEnd = new Date(slotDate);
      
      const [newStartHour, newStartMin] = startTime.split(':').map(Number);
      const [newEndHour, newEndMin] = endTime.split(':').map(Number);
      
      newSlotStart.setHours(newStartHour, newStartMin, 0, 0);
      newSlotEnd.setHours(newEndHour, newEndMin, 0, 0);

      // Check for overlapping slots
      const existingSlot = await AvailabilitySlot.findOne({
        mentor: mentorId,
        date: slotDate,
        $or: [
          {
            $and: [
              { startTime: { $lt: endTime } },
              { endTime: { $gt: startTime } }
            ]
          }
        ]
      });

      if (existingSlot) {
        return res.status(400).json({
          status: 'error',
          message: `Time slot overlaps with an existing slot on ${slotDate.toISOString().split('T')[0]} from ${existingSlot.startTime} to ${existingSlot.endTime}`
        });
      }

      // Check for existing sessions during this time
      const existingSessions = await Session.find({
        mentor: mentorId,
        status: { $nin: ['cancelled', 'rejected'] },
        $or: [
          // Session starts during the new slot
          {
            startTime: { $gte: newSlotStart, $lt: newSlotEnd }
          },
          // Session ends during the new slot
          {
            $expr: {
              $and: [
                { $gte: [{ $add: ["$startTime", { $multiply: ["$duration", 60000] }] }, newSlotStart] },
                { $lt: [{ $add: ["$startTime", { $multiply: ["$duration", 60000] }] }, newSlotEnd] }
              ]
            }
          },
          // Session spans the entire new slot
          {
            $and: [
              { startTime: { $lte: newSlotStart } },
              {
                $expr: {
                  $gte: [{ $add: ["$startTime", { $multiply: ["$duration", 60000] }] }, newSlotEnd]
                }
              }
            ]
          }
        ]
      });

      if (existingSessions.length > 0) {
        const sessionDetails = existingSessions.map(session => {
          const sessionEnd = new Date(session.startTime);
          sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration);
          return `${format(session.startTime, 'HH:mm')} - ${format(sessionEnd, 'HH:mm')}`;
        }).join(', ');

        return res.status(400).json({
          status: 'error',
          message: `Cannot create availability slot due to existing sessions on ${slotDate.toISOString().split('T')[0]} at: ${sessionDetails}`
        });
      }
    }

    // Create availability slots
    const slots = dates.map(slotDate => ({
      mentor: mentorId,
      date: slotDate,
      startTime,
      endTime,
      isWeeklySlot: recurring
    }));

    await AvailabilitySlot.insertMany(slots);

    res.status(201).json({
      status: 'success',
      message: 'Availability slot(s) created successfully',
      data: {
        slots
      }
    });
  } catch (error) {
    console.error('Error adding availability:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Remove availability slot
exports.removeAvailability = async (req, res) => {
  try {
    const { mentorId, slotId } = req.params;

    // Check if the authenticated user is the mentor
    if (mentorId !== req.user.id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only remove your own availability slots'
      });
    }

    // Check if user is a mentor
    const user = await User.findOne({
      _id: mentorId,
      roles: { $in: ['mentor'] }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found'
      });
    }

    // Get mentor profile
    const mentor = await Mentor.findOne({ user: mentorId });
    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found'
      });
    }

    // Find the slot
    const slot = await AvailabilitySlot.findOne({
      _id: slotId,
      mentor: mentorId
    });

    if (!slot) {
      return res.status(404).json({
        status: 'error',
        message: 'Availability slot not found'
      });
    }

    // Check for existing sessions during this time
    const slotStart = new Date(slot.date);
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    slotStart.setHours(startHour, startMin, 0, 0);

    const slotEnd = new Date(slot.date);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    slotEnd.setHours(endHour, endMin, 0, 0);

    const existingSessions = await Session.find({
      mentor: mentorId,
      status: { $nin: ['cancelled', 'rejected'] },
      $or: [
        // Session starts during the slot
        {
          startTime: { $gte: slotStart, $lt: slotEnd }
        },
        // Session ends during the slot
        {
          $expr: {
            $and: [
              { $gte: [{ $add: ["$startTime", { $multiply: ["$duration", 60000] }] }, slotStart] },
              { $lt: [{ $add: ["$startTime", { $multiply: ["$duration", 60000] }] }, slotEnd] }
            ]
          }
        },
        // Session spans the entire slot
        {
          $and: [
            { startTime: { $lte: slotStart } },
            {
              $expr: {
                $gte: [{ $add: ["$startTime", { $multiply: ["$duration", 60000] }] }, slotEnd]
              }
            }
          ]
        }
      ]
    });

    if (existingSessions.length > 0) {
      const sessionDetails = existingSessions.map(session => {
        const sessionEnd = new Date(session.startTime);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration);
        return `${format(session.startTime, 'HH:mm')} - ${format(sessionEnd, 'HH:mm')}`;
      }).join(', ');

      return res.status(400).json({
        status: 'error',
        message: `Cannot remove availability slot due to existing sessions at: ${sessionDetails}`
      });
    }

    // Remove the slot using findOneAndDelete
    await AvailabilitySlot.findOneAndDelete({ _id: slotId });

    res.json({
      status: 'success',
      message: 'Availability slot removed successfully'
    });
  } catch (error) {
    console.error('Error removing availability:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Set up default availability for a mentor
exports.setupDefaultAvailability = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user.id,
      roles: { $in: ['mentor'] }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found'
      });
    }

    const mentor = await Mentor.findOne({ user: user._id });
    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found'
      });
    }

    // Initialize empty availability
    mentor.availability = {
      monday: { available: false, slots: [] },
      tuesday: { available: false, slots: [] },
      wednesday: { available: false, slots: [] },
      thursday: { available: false, slots: [] },
      friday: { available: false, slots: [] },
      saturday: { available: false, slots: [] },
      sunday: { available: false, slots: [] }
    };

    await mentor.save();

    res.json({
      status: 'success',
      message: 'Availability initialized successfully',
      data: {
        availability: mentor.availability
      }
    });
  } catch (error) {
    console.error('Error initializing availability:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize availability',
      details: error.message
    });
  }
};

// Get current mentor profile
exports.getCurrentMentor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!user.roles.includes('mentor')) {
      return res.status(403).json({
        status: 'error',
        message: 'User is not a mentor'
      });
    }

    if (!user.mentorProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        mentor: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
          bio: user.mentorProfile.bio || '',
          expertise: user.mentorProfile.expertise || [],
          hourlyRate: user.mentorProfile.hourlyRate || 0,
          rating: user.mentorProfile.rating || 0,
          reviewCount: user.mentorProfile.reviewCount || 0,
          status: user.mentorProfile.status
        }
      }
    });
  } catch (err) {
    console.error('Error getting current mentor:', err);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { day, available, slots } = req.body;

    // Validate input
    if (!day || typeof available !== 'boolean' || !Array.isArray(slots)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request format. Required: day (string), available (boolean), slots (array)'
      });
    }

    // Validate day
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day.toLowerCase())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid day. Must be one of: ' + validDays.join(', ')
      });
    }

    // Validate slots format and sort them
    const validatedSlots = slots.map(slot => {
      if (!slot.startTime || !slot.endTime || 
          !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.startTime) ||
          !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.endTime)) {
        throw new Error('Invalid time format. Use HH:mm format');
      }

      // Convert times to minutes for comparison
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        throw new Error('End time must be after start time');
      }

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        startMinutes,
        endMinutes
      };
    });

    // Sort slots by start time
    validatedSlots.sort((a, b) => a.startMinutes - b.startMinutes);

    // Check for overlapping slots
    for (let i = 0; i < validatedSlots.length - 1; i++) {
      if (validatedSlots[i].endMinutes > validatedSlots[i + 1].startMinutes) {
        return res.status(400).json({
          status: 'error',
          message: 'Time slots cannot overlap'
        });
      }
    }

    // Find or create mentor document
    let mentor = await Mentor.findOne({ user: mentorId });
    if (!mentor) {
      mentor = new Mentor({
        user: mentorId,
        availability: {
          monday: { available: false, slots: [] },
          tuesday: { available: false, slots: [] },
          wednesday: { available: false, slots: [] },
          thursday: { available: false, slots: [] },
          friday: { available: false, slots: [] },
          saturday: { available: false, slots: [] },
          sunday: { available: false, slots: [] }
        },
        education: [],
        experience: []
      });
    }

    // Initialize availability if it doesn't exist
    if (!mentor.availability) {
      mentor.availability = {
        monday: { available: false, slots: [] },
        tuesday: { available: false, slots: [] },
        wednesday: { available: false, slots: [] },
        thursday: { available: false, slots: [] },
        friday: { available: false, slots: [] },
        saturday: { available: false, slots: [] },
        sunday: { available: false, slots: [] }
      };
    }

    // Get the date for the next occurrence of this day
    const today = new Date();
    const dayIndex = validDays.indexOf(day.toLowerCase());
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + (dayIndex + 7 - today.getDay()) % 7);
    nextDate.setHours(0, 0, 0, 0);

    // Get existing sessions for this day
    const endDate = new Date(nextDate);
    endDate.setHours(23, 59, 59, 999);

    const existingSessions = await Session.find({
      mentor: mentorId,
      startTime: { $gte: nextDate, $lt: endDate },
      status: { $nin: ['cancelled', 'rejected'] }
    });

    // Check for conflicts with existing sessions
    for (const slot of validatedSlots) {
      const slotStart = new Date(nextDate);
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      slotStart.setHours(startHour, startMin, 0, 0);
      
      const slotEnd = new Date(nextDate);
      slotEnd.setHours(endHour, endMin, 0, 0);

      const hasConflict = existingSessions.some(session => {
        const sessionEnd = new Date(session.startTime);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration);
        
        return (session.startTime >= slotStart && session.startTime < slotEnd) ||
               (sessionEnd > slotStart && sessionEnd <= slotEnd) ||
               (session.startTime <= slotStart && sessionEnd >= slotEnd);
      });

      if (hasConflict) {
        return res.status(400).json({
          status: 'error',
          message: `Time slot ${slot.startTime}-${slot.endTime} overlaps with an existing session`
        });
      }
    }

    // Clear existing slots for this day
    await AvailabilitySlot.deleteMany({
      mentor: mentorId,
      date: { $gte: nextDate, $lt: endDate }
    });

    // Update the specific day's availability
    mentor.availability[day.toLowerCase()] = {
      available,
      slots: validatedSlots.map(({ startTime, endTime }) => ({
        startTime,
        endTime
      }))
    };

    await mentor.save();

    // Generate availability slots for the next few weeks
    await generateAvailabilitySlots(mentor, new Date(), 4);

    res.json({
      status: 'success',
      data: {
        availability: mentor.availability
      }
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating availability'
    });
  }
}; 