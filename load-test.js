async function loadTestScenario(page, userContext, events) {
  await page.goto("http://localhost:4321");

  await page.click("button#happy-btn");
}

export { loadTestScenario };
