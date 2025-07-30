const http = require('http');

function testFileAccess(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: path,
    method: 'HEAD'
  };

  const req = http.request(options, (res) => {
    callback(null, res.statusCode);
  });

  req.on('error', (err) => {
    callback(err, null);
  });

  req.end();
}

console.log('Testing file access...');

// Test KTP file
testFileAccess('/api/uploads/residents/ktp_7171070908231234.jpg', (err, status) => {
  if (err) {
    console.log('❌ KTP file access error:', err.message);
  } else {
    console.log(`✅ KTP file status: ${status} ${status === 200 ? '(OK)' : '(Not OK)'}`);
  }
});

// Test KK file
testFileAccess('/api/uploads/residents/kk_7171070908231235.jpg', (err, status) => {
  if (err) {
    console.log('❌ KK file access error:', err.message);
  } else {
    console.log(`✅ KK file status: ${status} ${status === 200 ? '(OK)' : '(Not OK)'}`);
  }
});

console.log('Test completed!');
