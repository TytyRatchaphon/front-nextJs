// test-notification-api.js
// สคริปต์สำหรับทดสอบการสร้าง notification ผ่าน API

const axios = require('axios');

const BASE_URL = 'http://192.168.220.185:3331';

/**
 * Configuration
 */
const config = {
    // User 1: ผู้ที่จะสร้าง comment/review (ผู้กระทำ)
    user1Token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VySUQiOiJFSkIyMDI1blhlWjExMjQxNjEzNDQiLCJmdWxsbmFtZSI6IuC4muC4seC4h-C4muC4suC4quC4oeC4suC5geC4peC5ieC4pyIsIndyaXRlcl9uYW1lIjpudWxsLCJwaG9uZSI6IiIsImFkZHJlc3NfbWFpbiI6bnVsbCwiZW1haWwiOiJkZXZiYXNAZ21haWwuY29tIiwicHdzIjoiJDJiJDEwJGZZeHJVRTdENFUvaTFZcVAvVkFtZC5MeHFma01RenZsS1VhR1BkMnlFZ3VDRWoxUHhLZHJDIiwiYmFubmVyIjoiaHR0cHM6Ly9pbWFnZS5lbmpveWJvb2suY28vZW5qb3lib29rLmltYWdlL3Rlc3RtaW5pby91c2VyL2VqYi1iYW5uZXIuanBnIiwiaW1nIjoiaHR0cHM6Ly9pbWFnZS5lbmpveWJvb2suY28vZW5qb3lib29rLmltYWdlL3Rlc3RtaW5pby91c2VyL2VqYi1wcm9maWxlLnBuZyIsImRlcyI6bnVsbCwiZmFjZWJvb2siOm51bGwsInR3aXR0ZXIiOm51bGwsImNvaW4iOiIwLjAwIiwiZnJlZWNvaW4iOiIwLjAwIiwiaGVhcnQiOjAsImZsb3dlciI6MCwiY291cG9uIjoxNSwiZXhwX3BvaW50IjowLCJzdGFtcCI6MCwid2hlZWwiOjAsImZhc3RfdGlja2V0IjowLCJjb2luSW5jb21lIjoiMC4wMCIsImdlbmRlciI6Im5vIiwiYmlydGhkYXkiOm51bGwsInBlcmNlbnQiOjcwLCJwZXJjZW50X2RvbmF0ZSI6NzAsInB1Ymxpc2giOiJhY3RpdmUiLCJyZWdpc3RlckRhdGUiOiIyMDI1LTExLTI0VDA5OjEzOjQ0LjAwMFoiLCJjYXQxIjowLCJjYXQyIjowLCJtYWlsX3N1YiI6InllcyIsImZyYW1lX2lkIjpudWxsLCJha2FfaWQiOm51bGwsImZyYW1lIjpudWxsLCJha2EiOm51bGwsInRvdGFsQm9va3MiOjAsInRvdGFsRm9sbG93ZXJzIjowLCJpYXQiOjE3NjU1MjAxMjZ9.9c80eKGJ8lFfcDeXI4SrZqWTt9EnxiOW8JxbCqPPXaA',
    user1Id: 1,

    // User 2: เจ้าของหนังสือ (ผู้ที่จะได้รับ notification)
    user2Token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VySUQiOiJFSkIyMDI1OUFxWjEyMTIxMzE0NDgiLCJmdWxsbmFtZSI6IuC4muC4seC4h-C4muC4suC4quC4q-C4oeC4suC4ouC5gOC4peC4giAyIiwid3JpdGVyX25hbWUiOm51bGwsInBob25lIjpudWxsLCJhZGRyZXNzX21haW4iOm51bGwsImVtYWlsIjoiZGV2YmFzMkBnbWFpbC5jb20iLCJwd3MiOiIkMmIkMTAkWnY0WTFPb2o4ZUVmem5EN3ZvalJTdUFMbHIyTWZVNXpFQmpxVXd3cW1BOU11ZHd5Mm5Ia0MiLCJiYW5uZXIiOiJodHRwczovL2ltYWdlLmVuam95Ym9vay5jby9lbmpveWJvb2suaW1hZ2UvdGVzdG1pbmlvL3VzZXIvZWpiLWJhbm5lci5qcGciLCJpbWciOiJodHRwczovL2ltYWdlLmVuam95Ym9vay5jby9lbmpveWJvb2suaW1hZ2UvdGVzdG1pbmlvL3VzZXIvZWpiLXByb2ZpbGUucG5nIiwiZGVzIjpudWxsLCJmYWNlYm9vayI6bnVsbCwidHdpdHRlciI6bnVsbCwiY29pbiI6IjAuMDAiLCJmcmVlY29pbiI6IjAuMDAiLCJoZWFydCI6MCwiZmxvd2VyIjowLCJjb3Vwb24iOjAsImV4cF9wb2ludCI6MCwic3RhbXAiOjAsIndoZWVsIjowLCJmYXN0X3RpY2tldCI6MCwiY29pbkluY29tZSI6IjAuMDAiLCJnZW5kZXIiOiJubyIsImJpcnRoZGF5IjpudWxsLCJwZXJjZW50Ijo3MCwicGVyY2VudF9kb25hdGUiOjcwLCJwdWJsaXNoIjoiYWN0aXZlIiwicmVnaXN0ZXJEYXRlIjoiMjAyNS0xMi0xMlQwNjoxNDo0OC4wMDBaIiwiY2F0MSI6MCwiY2F0MiI6MCwibWFpbF9zdWIiOiJ5ZXMiLCJmcmFtZV9pZCI6bnVsbCwiYWthX2lkIjpudWxsLCJmcmFtZSI6bnVsbCwiYWthIjpudWxsLCJ0b3RhbEJvb2tzIjowLCJ0b3RhbEZvbGxvd2VycyI6MCwiaWF0IjoxNzY1NTIwNzI5fQ.UUCA6vvtOifVbpY4eeMQBdQiL9gqOhIjmRaEJVPqHes',
    user2Id: 2,

    // Test data
    bookId: 4569,
    episodeId: 100000024,
};

/**
 * Helper: แสดงผลสวยๆ
 */
function log(title, data) {
    console.log('\n' + '='.repeat(60));
    console.log(`📝 ${title}`);
    console.log('='.repeat(60));
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(60) + '\n');
}

/**
 * Helper: สร้าง axios instance with auth
 */
function createClient(token) {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
}

// =============== TEST FUNCTIONS ===============

/**
 * Test 1: Login เพื่อรับ token
 */
async function testLogin(email, password) {
    console.log(`🔐 Testing Login for ${email}...`);

    try {
        const response = await axios.post(`${BASE_URL}/login`, {
            email,
            password
        });

        log('Login Success', {
            token: response.data,
            //userId: response.data.user?.user_id,
            //username: response.data.user?.email
        });

        return response.data;
    } catch (error) {
        console.error('❌ Login Failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Test 2: สร้างรีวิวหนังสือ (จะส่ง notification ไปหาเจ้าของหนังสือ)
 */
async function testCreateReview() {
    console.log('📚 Testing: Create Book Review...');

    const client = createClient(config.user2Token);

    try {
        const response = await client.post(`/bookdetail/${config.bookId}/reviews`, {
            star: 5,
            comment: 'This is an amazing book! Highly recommended! 🌟',
        });

        const commentId = response.data.data['comment_book_id'];

        const notiResponse = await client.post(`/user/notifications/reviews/${commentId}`);

        log('Review Created', response.data);
        log('Notification Review Created', notiResponse.data)

        console.log('✅ Notification should be sent to book owner (User 2)');
        console.log('   Check the socket client for real-time notification!');

        return response.data;
    } catch (error) {
        console.error('❌ Create Review Failed:', error.response?.data || error.message);
    }
}

/**
 * Test 3: ตอบกลับรีวิว (จะส่ง notification ไปหาคนที่เขียนรีวิว)
 */
async function testReplyToReview(reviewId) {
    console.log('💬 Testing: Reply to Review...');

    const client = createClient(config.user2Token); // เจ้าของหนังสือตอบกลับ

    try {
        const response = await client.post(
            `/bookdetail/reviews/${reviewId}/replies`,
            {
                comment: 'Thank you so much for your kind review! 🙏'
            }
        );

        const commentId = response.data.data['comment_sub_book_id'];
        console.log(commentId);
        const notiResponse = await client.post(`/user/notifications/reviews/replies/${commentId}`);

        log('Reply Created', response.data);
        log('Notification Reply to Review Created', notiResponse.data)

        console.log('✅ Notification should be sent to review author (User 1)');
        console.log('   Check the socket client for real-time notification!');

        return response.data;
    } catch (error) {
        console.error('❌ Reply to Review Failed:', error.response?.data || error.message);
    }
}

/**
 * Test 4: สร้างความคิดเห็นในตอน (จะส่ง notification ไปหาเจ้าของหนังสือ)
 */
async function testCreateComment() {
    console.log('💭 Testing: Create Episode Comment...');

    const client = createClient(config.user2Token);

    try {
        const response = await client.post(
            `/readep/${config.episodeId}/comments`,
            {
                comment: 'This episode was incredible! Can\'t wait for the next one! 🔥'
            }
        );

        log('Comment Created', response.data);

        const commentId = response.data.data['comment_ep_id']

        const notiResponse = await client.post(`/user/notifications/comments/${commentId}`);

        log('Notification Reply to Comment Created', notiResponse.data)

        console.log('✅ Notification should be sent to book owner (User 2)');
        console.log('   Check the socket client for real-time notification!');

        return response.data;

    } catch (error) {
        console.error('❌ Create Comment Failed:', error.response?.data || error.message);
    }
}

/**
 * Test 5: ตอบกลับความคิดเห็น (จะส่ง notification ไปหาคนที่แสดงความคิดเห็น)
 */
async function testReplyToComment(commentId) {
    console.log('💬 Testing: Reply to Comment...');

    const client = createClient(config.user1Token);

    try {
        const response = await client.post(
            `/readep/comments/${commentId}/replies`,
            {
                comment: 'Thank you! The next episode will be even better! 😊'
            }
        );

        const resCommentId = response.data.data['comment_sub_ep_id'];

        const notiResponse = await client.post(`/user/notifications/comments/replies/${resCommentId}`);

        log('Reply Comment Created', response.data);
        log('Notification Repy Comment Created', notiResponse.data);

        console.log('✅ Notification should be sent to comment author (User 1)');
        console.log('   Check the socket client for real-time notification!');

        return response.data;
    } catch (error) {
        console.error('❌ Reply to Comment Failed:', error.response?.data || error.message);
    }
}


/**
 * Test 6: ดึงรายการ notifications
 */
async function testGetNotifications(token, userId) {
    console.log(`📬 Testing: Get Notifications for User ${userId}...`);

    const client = createClient(token);

    try {
        const response = await client.get('/user/notifications', {
            params: {
                page: 1,
                limit: 5
            }
        });

        log('Notifications Retrieved', {
            total: response.data.data.pagination?.total || 0,
            notifications: response.data.data.notifications?.slice(0, 3) || []
        });

        return response.data;
    } catch (error) {
        console.error('❌ Get Notifications Failed:', error.response?.data || error.message);
    }
}

//ไม่มี
/**
 * Test 7: ดึง notifications ที่ยังไม่อ่าน
 */
async function testGetRecentUnreadNotifications(token, userId) {
    console.log(`📬 Testing: Get Unread Notifications for User ${userId}...`);

    const client = createClient(token);

    try {
        const response = await client.get('user/notifications/recents');

        log('Unread Notifications', {
            count: response.data.recent_notifications?.length || 0,
            notifications: response.data.recent_notifications || []
        });

        return response.data;
    } catch (error) {
        console.error('❌ Get Unread Notifications Failed:', error.response?.data || error.message);
    }
}


/**
 * Test 8: ทำเครื่องหมายว่าอ่านแล้ว
 */
async function testMarkAsRead(token, notificationId) {
    console.log(`👁️  Testing: Mark Notification ${notificationId} as Read...`);

    const client = createClient(token);

    try {
        const response = await client.patch(`/user/notifications/${notificationId}/read`);

        log('Marked as Read', response.data);

        console.log('✅ Socket client should receive notification:read event');

        return response.data;
    } catch (error) {
        console.error('❌ Mark as Read Failed:', error.response?.data || error.message);
    }
}

/**
 * Test 9: ทำเครื่องหมายว่าอ่านทั้งหมด
 */
async function testMarkAllAsRead(token) {
    console.log('👁️  Testing: Mark All Notifications as Read...');

    const client = createClient(token);

    try {
        const response = await client.patch('/user/notifications/read-all');

        log('Marked All as Read', response.data);

        console.log('✅ Socket client should receive notification:read-all event');

        return response.data;
    } catch (error) {
        console.error('❌ Mark All as Read Failed:', error.response?.data || error.message);
    }
}

/**
 * Test 10: ตรวจสอบ server status
 */
async function testServerStatus() {
    console.log('📊 Testing: Server Status...');

    try {
        const response = await axios.get(`${BASE_URL}/api/status`);

        log('Server Status', response.data);

        return response.data;
    } catch (error) {
        console.error('❌ Server Status Failed:', error.response?.data || error.message);
    }
}

// =============== MAIN TEST RUNNER ===============

async function runAllTests() {
    console.log('\n🚀 Starting Notification System Tests...\n');

    try {
        // Test server status
        await testServerStatus();

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test creating review (User 1 reviews User 2's book)
        console.log('\n📝 Scenario 1: User 1 reviews User 2\'s book');
        const review = await testCreateReview();

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test getting notifications (User 2 should receive notification)
        console.log('\n📬 Checking User 2\'s notifications...');
        await testGetRecentUnreadNotifications(config.user2Token, config.user2Id);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test replying to review (if review was created)
        if (review?.data?.comment_book_id) {
            console.log('\n📝 Scenario 2: User 2 replies to User 1\'s review');
            await testReplyToReview(review.data.comment_book_id);

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check User 1's notifications
            console.log('\n📬 Checking User 1\'s notifications...');
            const userNotifications = await testGetRecentUnreadNotifications(config.user1Token, config.user1Id);

            // Mark first notification as read (if exists)
            if (userNotifications?.recent_notifications?.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const firstNoti = userNotifications.recent_notifications[0];
                await testMarkAsRead(config.user1Token, firstNoti.id);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test creating comment
        console.log('\n📝 Scenario 3: User 1 comments on User 2\'s episode');
        const comment = await testCreateComment();

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Final status check
        console.log('\n📊 Final server status:');
        await testServerStatus();

        console.log('\n✅ All tests completed!');
        console.log('📝 Note: Check the socket client terminal for real-time notifications');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// =============== CLI INTERFACE ===============

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('\n📋 Usage:');
    console.log('   node test-notification-api.js <command> [...args]');
    console.log('\nAvailable commands:');
    console.log('   all                          - Run all tests');
    console.log('   login <username> <password>  - Test login');
    console.log('   review                       - Test create review');
    console.log('   comment                      - Test create comment');
    console.log('   comment-reply <commentId>    - Test create comment');
    console.log('   get <token> <userId>         - Get notifications');
    console.log('   unread <token> <userId>      - Get unread notifications');
    console.log('   read <token> <notiId>        - Mark as read');
    console.log('   read-all <token>             - Mark all as read');
    console.log('   status                       - Check server status');
    console.log('\nExample:');
    console.log('   node test-notification-api.js all');
    console.log('   node test-notification-api.js status');
    console.log('');
    process.exit(0);
}

const command = args[0];

switch (command) {
    case 'all':
        runAllTests();
        break;
    case 'login':
        testLogin(args[1], args[2]);
        break;
    case 'review':
        testCreateReview();
        break;
    case 'review-reply':
        testReplyToReview(args[1]);
        break;
    case 'comment':
        testCreateComment();
        break;
    case 'comment-reply':
        testReplyToComment(args[1]);
        break;
    case 'get':
        testGetNotifications(args[1], args[2]);
        break;
    case 'unread':
        testGetRecentUnreadNotifications(args[1], args[2]);
        break;
    case 'read':
        testMarkAsRead(args[1], args[2]);
        break;
    case 'read-all':
        testMarkAllAsRead(args[1]);
        break;
    case 'status':
        testServerStatus();
        break;
    default:
        console.error(`Unknown command: ${command}`);
        console.log('Run without arguments to see available commands');
        process.exit(1);
}
