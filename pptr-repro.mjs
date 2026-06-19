import puppeteer from "puppeteer";
const CHROME = "/nix/store/5afrhwm7zqn1vb7p5z1mc2rkh2grsfgz-ungoogled-chromium-138.0.7204.100/bin/chromium";
const browser = await puppeteer.launch({ headless: "new", executablePath: CHROME, args: ["--no-sandbox","--disable-setuid-sandbox","--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });
const errors=[]; page.on("pageerror",e=>errors.push(e.message));
await page.goto("http://localhost:5000/upload/edit-pdf", { waitUntil: "networkidle2", timeout: 45000 });
const fi = await page.waitForSelector('[data-testid="input-pdf"]', { timeout: 15000 });
await fi.uploadFile("/tmp/sample.pdf");
await page.waitForSelector('[data-testid="page-0"]', { timeout: 30000 });
const box = await (await page.$('[data-testid="page-0"]')).boundingBox();
const at=(dx,dy)=>({x:box.x+dx,y:box.y+dy});
const count=async()=>page.$$eval('[data-testid^="el-"]', e=>e.length);
const paths=async()=>page.$$eval('svg path', e=>e.length);
const log=async(n)=>console.log(`after ${n}: el=${await count()} paths=${await paths()}`);
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));

// EXACT run-1 order: text, rect, highlight, draw, stamp, note
await page.click('[data-testid="button-tool-text"]'); { const p=at(120,150); await page.mouse.click(p.x,p.y);} await wait(200);
const inp=await page.$('[data-testid="input-text-content"]'); if(inp){await page.click('[data-testid="input-text-content"]',{clickCount:3});await page.type('[data-testid="input-text-content"]',"Hello Editor");} await log("text");
await page.click('[data-testid="button-tool-rect"]'); { const a=at(200,300),b=at(360,380); await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:6});await page.mouse.up();} await wait(150); await log("rect");
await page.click('[data-testid="button-tool-highlight"]'); { const a=at(80,200),b=at(300,222); await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:6});await page.mouse.up();} await wait(150); await log("highlight");
await page.click('[data-testid="button-tool-draw"]'); { const a=at(100,450); await page.mouse.move(a.x,a.y);await page.mouse.down(); for(let i=0;i<8;i++){const m=at(100+i*20,450+Math.sin(i)*20);await page.mouse.move(m.x,m.y,{steps:2});} await page.mouse.up();} await wait(150); await log("draw");
await page.click('[data-testid="button-tool-stamp"]'); { const p=at(380,120); await page.mouse.click(p.x,p.y);} await wait(150); await log("stamp");
await page.click('[data-testid="button-tool-note"]'); { const p=at(150,560); await page.mouse.click(p.x,p.y);} await wait(150); await log("note");

console.log("ERRORS:", errors.length?errors:"none");
await browser.close();
