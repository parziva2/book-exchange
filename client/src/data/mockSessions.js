export const mockSessions = [
  {
    _id: '1',
    title: 'Web Development Basics',
    topic: 'Programming',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    duration: 60,
    isCancelled: false,
    mentor: {
      _id: 'm1',
      username: 'John Doe',
      profile: {
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        bio: 'Senior Web Developer with 8 years of experience'
      }
    },
    rating: null
  },
  {
    _id: '2',
    title: 'JavaScript Advanced Concepts',
    topic: 'Programming',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    duration: 90,
    isCancelled: false,
    mentor: {
      _id: 'm2',
      username: 'Jane Smith',
      profile: {
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        bio: 'JavaScript Expert & Tech Lead'
      }
    },
    rating: 5
  },
  {
    _id: '3',
    title: 'React State Management',
    topic: 'Programming',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // in 3 days
    duration: 60,
    isCancelled: false,
    mentor: {
      _id: 'm3',
      username: 'Mike Johnson',
      profile: {
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        bio: 'React Native Developer'
      }
    },
    rating: null
  },
  {
    _id: '4',
    title: 'Database Design',
    topic: 'Backend',
    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    duration: 120,
    isCancelled: true,
    cancelReason: 'Schedule conflict',
    mentor: {
      _id: 'm4',
      username: 'Sarah Wilson',
      profile: {
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        bio: 'Database Architect'
      }
    },
    rating: null
  }
]; 