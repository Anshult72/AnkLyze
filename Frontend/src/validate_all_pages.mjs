async function testRoutes() {
  const routes = [
    '/',
    '/ai-answer-sheet-evaluation',
    '/handwritten-answer-sheet-grading',
    '/subjective-answer-evaluation',
    '/resources',
    '/contact',
    '/pricing',
    '/about',
    '/examiner/dashboard',
    '/examiner/evaluate/A-10492'
  ];

  console.log('Testing all marketing and application routes on http://localhost:3000 ...\n');
  let allPassed = true;

  for (const route of routes) {
    try {
      const start = Date.now();
      const res = await fetch(`http://localhost:3000${route}`);
      const duration = Date.now() - start;
      if (res.status === 200) {
        console.log(`✓ [200 OK] ${route} (${duration}ms)`);
      } else {
        console.error(`✗ [${res.status} FAIL] ${route}`);
        allPassed = false;
      }
    } catch (err) {
      console.error(`✗ [ERROR] ${route}:`, err.message);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n🎉 ALL ROUTES RENDERED WITH HTTP 200 OK!');
    process.exit(0);
  } else {
    console.error('\n❌ SOME ROUTES FAILED');
    process.exit(1);
  }
}

testRoutes();
