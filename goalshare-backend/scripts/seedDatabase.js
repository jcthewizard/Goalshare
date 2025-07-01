require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const { connectDB } = require('../src/config/db');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Post.deleteMany({});
    
    // Create sample users
    console.log('👥 Creating sample users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.create([
      {
        username: 'alexsmith',
        email: 'alex@example.com',
        password: hashedPassword,
        displayName: 'Alex Smith',
        avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
        bio: 'Fitness enthusiast and language learner'
      },
      {
        username: 'sarahlee',
        email: 'sarah@example.com',
        password: hashedPassword,
        displayName: 'Sarah Lee',
        avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
        bio: 'Marathon runner and book lover'
      },
      {
        username: 'mikejones',
        email: 'mike@example.com',
        password: hashedPassword,
        displayName: 'Mike Jones',
        avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
        bio: 'Musician and creative soul'
      },
      {
        username: 'emmawilson',
        email: 'emma@example.com',
        password: hashedPassword,
        displayName: 'Emma Wilson',
        avatarUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
        bio: 'Tech enthusiast and lifelong learner'
      }
    ]);
    
    console.log(`✅ Created ${users.length} users`);
    
    // Create sample posts
    console.log('📝 Creating sample posts...');
    
    const posts = await Post.create([
      {
        user: {
          userId: users[0]._id,
          username: users[0].username,
          displayName: users[0].displayName,
          avatarUrl: users[0].avatarUrl
        },
        content: {
          text: 'Just completed my first 10 Spanish lessons! 🇪🇸',
          imageUrl: null
        },
        milestone: {
          goalId: 'goal1',
          goalTitle: 'Learn Spanish',
          milestoneId: 'milestone1',
          milestoneTitle: 'Complete first 10 lessons',
          milestoneDescription: 'Finished the basic introduction to Spanish grammar and vocabulary'
        },
        postType: 'milestone',
        likes: [],
        comments: [
          {
            userId: users[1]._id,
            username: users[1].displayName,
            text: 'Great job! Keep it up! 👏',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        user: {
          userId: users[1]._id,
          username: users[1].username,
          displayName: users[1].displayName,
          avatarUrl: users[1].avatarUrl
        },
        content: {
          text: 'Completed my 10k training run in 55 minutes! Feeling stronger every day! 🏃‍♀️',
          imageUrl: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cnVubmluZ3xlbnwwfHwwfHw%3D'
        },
        milestone: {
          goalId: 'goal2',
          goalTitle: 'Run a Marathon',
          milestoneId: 'milestone2',
          milestoneTitle: 'Complete 10k training run',
          milestoneDescription: 'Finished a 10k run in 55 minutes - feeling stronger every day!'
        },
        postType: 'milestone',
        likes: [users[0]._id, users[2]._id],
        comments: [
          {
            userId: users[0]._id,
            username: users[0].displayName,
            text: 'Amazing pace! You\'re going to crush that marathon! 💪',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        user: {
          userId: users[2]._id,
          username: users[2].username,
          displayName: users[2].displayName,
          avatarUrl: users[2].avatarUrl
        },
        content: {
          text: 'Successfully played "Wonderwall" all the way through! 🎸',
          imageUrl: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        },
        milestone: {
          goalId: 'goal3',
          goalTitle: 'Learn Guitar',
          milestoneId: 'milestone3',
          milestoneTitle: 'Play first song',
          milestoneDescription: 'Successfully played "Wonderwall" all the way through!'
        },
        postType: 'milestone',
        likes: [users[0]._id, users[1]._id],
        comments: []
      },
      {
        user: {
          userId: users[1]._id,
          username: users[1].username,
          displayName: users[1].displayName,
          avatarUrl: users[1].avatarUrl
        },
        content: {
          text: 'Just finished "Atomic Habits" - highly recommend! 📚',
          imageUrl: null
        },
        milestone: {
          goalId: 'goal4',
          goalTitle: 'Read 50 Books This Year',
          milestoneId: 'milestone4',
          milestoneTitle: 'Finish book #10',
          milestoneDescription: 'Just finished "Atomic Habits" - highly recommend!'
        },
        postType: 'milestone',
        likes: [],
        comments: [
          {
            userId: users[0]._id,
            username: users[0].displayName,
            text: 'That book changed my life! What\'s next on your list?',
            createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000)
          },
          {
            userId: users[2]._id,
            username: users[2].displayName,
            text: 'You\'re flying through those books! 📚',
            createdAt: new Date(Date.now() - 0.3 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        user: {
          userId: users[3]._id,
          username: users[3].username,
          displayName: users[3].displayName,
          avatarUrl: users[3].avatarUrl
        },
        content: {
          text: 'Built my first React Native app! So excited to share it with everyone! 📱',
          imageUrl: null
        },
        milestone: {
          goalId: 'goal5',
          goalTitle: 'Learn Mobile Development',
          milestoneId: 'milestone5',
          milestoneTitle: 'Build first app',
          milestoneDescription: 'Created a fully functional React Native application'
        },
        postType: 'milestone',
        likes: [users[0]._id],
        comments: [
          {
            userId: users[2]._id,
            username: users[2].displayName,
            text: 'Congrats! Can\'t wait to try it out! 🎉',
            createdAt: new Date(Date.now() - 0.1 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    ]);
    
    console.log(`✅ Created ${posts.length} posts`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`📝 Posts: ${posts.length}`);
    console.log('\n🔐 Sample login credentials:');
    console.log('Email: alex@example.com | Password: password123');
    console.log('Email: sarah@example.com | Password: password123');
    console.log('Email: mike@example.com | Password: password123');
    console.log('Email: emma@example.com | Password: password123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seeder
seedDatabase(); 