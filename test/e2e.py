from playwright.sync_api import sync_playwright

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

with sync_playwright() as p:
    print("launch", flush=True)
    browser = p.chromium.launch(headless=True, executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    requests = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("request", lambda request: requests.append(request.url))
    page.goto("http://127.0.0.1:4177", wait_until="domcontentloaded")
    print("loaded", flush=True)
    page.locator("#login-password").wait_for()
    assert page.locator("#login-password").input_value() == "1234"
    page.locator("#login").click()
    print("logged-in", flush=True)
    page.get_by_role("heading", name="课堂点名簿").wait_for()
    page.locator('[data-tab="stats"]').last.evaluate("element => element.click()")
    print("stats", flush=True)
    page.get_by_text("晶晶唐", exact=True).wait_for()
    assert "出勤 6/6 · 100%" in page.content()
    assert "上麦 3 次" in page.content()
    assert page.locator(".summary-card h3").first.inner_text() == "晶晶唐"
    page.locator('[data-sort="mic"]').evaluate("element => element.click()")
    assert page.locator(".summary-card h3").first.inner_text() == "晶晶唐"
    page.locator('[data-tab="history"]').evaluate("element => element.click()")
    print("history", flush=True)
    page.get_by_role("button", name="查看 / 修改").first.click()
    page.get_by_role("heading", name="记考勤").wait_for()
    print("record", flush=True)
    assert page.locator("#record-date").input_value() == "2026-08-16"
    page.screenshot(path="test/mobile-smoke.png", full_page=True)
    print("shot", flush=True)
    assert not errors, f"Browser console errors: {errors}"
    assert not any("fonts.googleapis" in url or "tesseract.js" in url or "xlsx" in url for url in requests)
    browser.close()
