/*
----- Coding Tutorial by Patt Vira ----- 
Name: Interactive Fridge Magnets
Video Tutorial: https://youtu.be/72pAzuD8tqE

Connect with Patt: @pattvira
https://www.pattvira.com/
----------------------------------------
*/

let video, handPose, hands = [];
let rocket;
let meteors = [];
let numMeteors = 5;
let grabbedMeteor = null;
let gameover = false;
let rocketImg;
let spaceMaskImg; // 新增
let planetMeteorImg;
let letterMeteors = [];
let collectedLetters = [];
let allLetters = ['t', 'k', 'u', 'e'];
let win = false;
let gameState = "home"; // 新增首頁狀態 home/game/instruction
let pixelFont;

function preload() {
  handPose = ml5.handPose({flipped: true});
  rocketImg = loadImage('0.png');
  spaceMaskImg = loadImage('SPACE.PNG'); // 這裡已經正確
  planetMeteorImg = loadImage('planet.png');
  pixelFont = loadFont('字體.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(pixelFont);
  video = createCapture(VIDEO);
  video.size(width, height); // 讓 video 跟畫布一樣大
  video.hide();
  handPose.detectStart(video, gotHands);

  rocket = new Rocket();
  for (let i = 0; i < numMeteors; i++) {
    meteors.push(new Meteor());
  }
  // 只出現2個字母隕石，隨機選2個
  shuffle(allLetters, true);
  for (let i = 0; i < 2; i++) {
    let letter = random(allLetters);
    letterMeteors.push(new LetterMeteor(letter));
  }
}

function draw() {
  background(0);
  if (gameState === "home") {
    // 首頁背景
    image(spaceMaskImg, 0, 0, width, height);

    // 星星等背景...
    for (let i = 0; i < 50; i++) {
      let sx = random(width);
      let sy = (frameCount * 0.2 + i * 50) % height; // 移動速度變慢
      let twinkle = 180 + 75 * sin(frameCount * 0.02 + i); // 慢速閃爍
      let starColor = color(
        random(180, 255), // R
        random(180, 255), // G
        random(180, 255), // B
        twinkle // 透明度
      );
      fill(starColor);
      noStroke();
      ellipse(sx, sy, random(1, 4));
    }

    // 遊戲標題
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("Rocket Meteor Game", width / 2, height / 3);

    // 遊戲開始按鈕
    let startBtnX = width / 2;
    let startBtnY = height / 2;
    let startBtnW = 200;
    let startBtnH = 60;
    let hoveringStart = mouseX > startBtnX - startBtnW/2 && mouseX < startBtnX + startBtnW/2 &&
                        mouseY > startBtnY - startBtnH/2 && mouseY < startBtnY + startBtnH/2;
    fill(hoveringStart && mouseIsPressed ? 180 : hoveringStart ? 220 : 255, 255, 255, 220);
    rectMode(CENTER);
    rect(startBtnX, startBtnY, startBtnW, startBtnH, 20);
    fill(50, 50, 50);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("遊戲開始", startBtnX, startBtnY);

    // 遊戲說明按鈕
    let infoBtnY = startBtnY + 90;
    let hoveringInfo = mouseX > startBtnX - startBtnW/2 && mouseX < startBtnX + startBtnW/2 &&
                       mouseY > infoBtnY - startBtnH/2 && mouseY < infoBtnY + startBtnH/2;
    fill(hoveringInfo && mouseIsPressed ? 180 : hoveringInfo ? 220 : 255, 255, 255, 220);
    rect(startBtnX, infoBtnY, startBtnW, startBtnH, 20);
    fill(50, 50, 50);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("遊戲說明", startBtnX, infoBtnY);

    // 儲存按鈕位置供 mousePressed 使用
    window._startBtn = {x: startBtnX, y: startBtnY, w: startBtnW, h: startBtnH};
    window._infoBtn = {x: startBtnX, y: infoBtnY, w: startBtnW, h: startBtnH};
    return;
  }

  if (gameState === "instruction") {
    image(spaceMaskImg, 0, 0, width, height);
    fill(255);
    textSize(36);
    textAlign(CENTER, TOP);
    text("遊戲說明", width / 2, 60);
    textSize(24);
    textAlign(CENTER, TOP);
    text(
      "開啟鏡頭，並捏住星球\n不要讓紅色隕石撞擊火箭\n並收集完 T K U E T 即可過關",
      width / 2,
      120
    );
    textSize(20);
    text("點擊畫面返回首頁", width / 2, height - 60);
    return;
  }

  push();
  translate(width, 0);
  scale(-1, 1); // 水平反轉整個畫布

  background(3, 3, 12); // 更暗的太空背景
  image(video, 0, 0, width, height);

  // 疊加 SPACE.PNG 遮罩
  image(spaceMaskImg, 0, 0, width, height);

  // 加這一層黑色透明遮罩
  fill(0, 180); // 180為透明度，可依需求調整
  noStroke();
  rect(0, 0, width, height);

  if (!gameover) {
    // 火箭自動往上移動
    rocket.update();
    rocket.display();

    // 隕石處理
    for (let m of meteors) {
      m.update();
      m.display();
      if (!grabbedMeteor && rocket.collide(m)) {
        gameover = true;
      }
    }

    // 字母隕石處理
    for (let lm of letterMeteors) {
      lm.update();
      lm.display();
      if (!grabbedMeteor && rocket.collide(lm)) {
        // 收集字母
        if (lm.letter === 't') {
          // 收集到 t 時允許收集兩次
          let tCount = collectedLetters.filter(l => l === 't').length;
          if (tCount < 2) {
            collectedLetters.push('t');
          }
        } else if (!collectedLetters.includes(lm.letter)) {
          collectedLetters.push(lm.letter);
        }
        // 讓這個字母隕石重生
        lm.letter = random(allLetters); // 每次重生隨機字母
        lm.x = random(60, width - 60);
        lm.y = random(-200, 0);
        lm.speed = random(0.8, 1.8);
      }
    }

    // 手勢偵測與隕石拖曳
    if (hands.length > 0) {
      let index = hands[0].keypoints[8];
      let thumb = hands[0].keypoints[4];

      // 依照 video 與畫布的比例縮放
      let scaleX = width / video.width;
      let scaleY = height / video.height;

      let indexX = index.x * scaleX;
      let indexY = index.y * scaleX;
      let thumbX = thumb.x * scaleX;
      let thumbY = thumb.y * scaleX;

      // 反轉 x 座標
      let flippedIndexX = width - indexX;
      let flippedThumbX = width - thumbX;

      // 計算食指與大拇指的距離
      let pinchDist = dist(indexX, indexY, thumbX, thumbY);

      // 食指：粉藍色
      fill(120, 200, 255);
      noStroke();
      ellipse(flippedIndexX, indexY, 20);
      // 不要顯示文字
      // textSize(16);
      // textAlign(CENTER, BOTTOM);
      // push();
      // scale(-1, 1);
      // text("食指", -flippedIndexX, indexY - 12);
      // pop();

      // 大拇指：粉藍色
      fill(120, 200, 255);
      ellipse(flippedThumbX, thumbY, 20);
      // 不要顯示文字
      // textSize(16);
      // textAlign(CENTER, BOTTOM);
      // push();
      // scale(-1, 1);
      // text("大拇指", -flippedThumbX, thumbY - 12);
      // pop();

      // 顯示捏住狀態
      textSize(24);
      fill(pinchDist < 40 ? 'red' : 'white');
      textAlign(LEFT, TOP);
      push();
      scale(-1, 1);
      text(pinchDist < 40 ? "捏住!" : "請捏住隕石", -(width - 20), 60); // 右上角，y=60
      pop();

      // 用食指控制火箭左右
      // rocket.x = constrain(flippedIndexX, 30, width - 30); // ← 刪除或註解這行

      // 捏住隕石
      if (pinchDist < 40) {
        if (!grabbedMeteor) {
          // 先檢查一般隕石
          for (let m of meteors) {
            if (dist(flippedIndexX, indexY, m.x, m.y) < m.r + 20) {
              grabbedMeteor = m;
              break;
            }
          }
          // 再檢查字母隕石
          if (!grabbedMeteor) {
            for (let lm of letterMeteors) {
              if (dist(flippedIndexX, indexY, lm.x, lm.y) < lm.r + 20) {
                grabbedMeteor = lm;
                break;
              }
            }
          }
        }
        if (grabbedMeteor) {
          grabbedMeteor.x = flippedIndexX;
          grabbedMeteor.y = indexY;
        }
      } else {
        grabbedMeteor = null;
      }
    } else {
      // 沒有偵測到手
      fill(255);
      textSize(24);
      textAlign(LEFT, TOP);
      push();
      scale(-1, 1);
      text("請將手放入鏡頭", -(width - 20), 20); // 右上角
      pop();
    }
  } else {
    fill(0, 180);
    rect(0, 0, width, height);
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    push();
    scale(-1, 1);
    textAlign(CENTER, CENTER);
    text("遊戲結束", -width / 2, height / 2);
    pop();
    // 刪除請重新整理字樣
    // textSize(24);
    // textAlign(CENTER, CENTER);
    // text("請重新整理", width / 2, height / 2 + 40);

    // 畫 ↺ 按鈕
    let btnX = width / 2;
    let btnY = height / 2 + 100;
    let btnR = 40;
    fill(255, 255, 255, 200);
    ellipse(btnX, btnY, btnR * 2);
    fill(50, 50, 50);
    textSize(48); // 可依需求調整大小
    textAlign(CENTER, CENTER);
    text("↺", btnX, btnY);

    noLoop();
    return;
  }

  // 彩色閃爍星星
  for (let i = 0; i < 50; i++) {
    let sx = random(width);
    let sy = (frameCount * 0.2 + i * 50) % height; // 移動速度變慢
    let twinkle = 180 + 75 * sin(frameCount * 0.02 + i); // 慢速閃爍
    let starColor = color(
      random(180, 255), // R
      random(180, 255), // G
      random(180, 255), // B
      twinkle // 透明度
    );
    fill(starColor);
    noStroke();
    ellipse(sx, sy, random(1, 4));
  }

  // 檢查勝利條件
  if (allLetters.every(l => collectedLetters.includes(l))) {
    win = true;
  }

  // 顯示已收集字母（左下角正常顯示）
  fill(255);
  textSize(24);
  textAlign(LEFT, BOTTOM);
  push();
  scale(-1, 1);
  text("已收集: " + collectedLetters.join(' '), -(width - 20), height - 20);
  pop();

  // 顯示通關訊息
  if (win || gameover) {
    fill(0, 180);
    rect(0, 0, width, height);
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    push();
    scale(-1, 1);
    textAlign(CENTER, CENTER);
    if (win) {
      text("馬到成功!", -width / 2, height / 2 - 100);
    } else {
      text("失敗，超可憐QQ", -width / 2, height / 2 - 100);
    }
    pop();

    // 重新開始按鈕
    let restartBtnX = width / 2;
    let restartBtnY = height / 2 + 20;
    let btnW = 200;
    let btnH = 60;
    let hoveringRestart = mouseX > restartBtnX - btnW/2 && mouseX < restartBtnX + btnW/2 &&
                          mouseY > restartBtnY - btnH/2 && mouseY < restartBtnY + btnH/2;
    fill(hoveringRestart && mouseIsPressed ? 180 : hoveringRestart ? 220 : 255, 255, 255, 220);
    rectMode(CENTER);
    rect(restartBtnX, restartBtnY, btnW, btnH, 20);
    fill(50, 50, 50);
    textSize(32);
    textAlign(CENTER, CENTER);
    push();
    translate(restartBtnX, restartBtnY);
    scale(-1, 1);
    text("重新開始", 0, 0);
    pop();

    // 返回主頁按鈕
    let homeBtnY = restartBtnY + 90;
    let hoveringHome = mouseX > restartBtnX - btnW/2 && mouseX < restartBtnX + btnW/2 &&
                       mouseY > homeBtnY - btnH/2 && mouseY < homeBtnY + btnH/2;
    fill(hoveringHome && mouseIsPressed ? 180 : hoveringHome ? 220 : 255, 255, 255, 220);
    rect(restartBtnX, homeBtnY, btnW, btnH, 20);
    fill(50, 50, 50);
    textSize(32);
    textAlign(CENTER, CENTER);
    push();
    translate(restartBtnX, homeBtnY);
    scale(-1, 1);
    text("返回主頁", 0, 0);
    pop();

    // 儲存按鈕位置供 mousePressed 使用
    window._restartBtn = {x: restartBtnX, y: restartBtnY, w: btnW, h: btnH};
    window._homeBtn = {x: restartBtnX, y: homeBtnY, w: btnW, h: btnH};

    noLoop();
    return;
  }

  pop();
}

function gotHands(results) {
  hands = results;
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    rocket.x -= 30;
  } else if (keyCode === RIGHT_ARROW) {
    rocket.x += 30;
  }
  rocket.x = constrain(rocket.x, 30, width - 30);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (video) {
    video.size(windowWidth, windowHeight); // 讓 video 跟著畫布變大
  }
}

// 修改 mousePressed 以支援首頁按鈕
function mousePressed() {
  if (gameState === "home" && window._startBtn && window._infoBtn) {
    let {x, y, w, h} = window._startBtn;
    if (mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2) {
      gameState = "game";
      loop();
      return;
    }
    let info = window._infoBtn;
    if (mouseX > info.x - info.w/2 && mouseX < info.x + info.w/2 && mouseY > info.y - info.h/2 && mouseY < info.y + info.h/2) {
      gameState = "instruction";
      loop();
      return;
    }
  } else if (gameState === "instruction") {
    gameState = "home";
    loop();
    return;
  }

  // 以下為遊戲結束畫面按鈕
  if ((win || gameover) && gameState === "game") {
    let rBtn = window._restartBtn;
    let hBtn = window._homeBtn;
    // 重新開始
    if (rBtn && mouseX > rBtn.x - rBtn.w/2 && mouseX < rBtn.x + rBtn.w/2 &&
        mouseY > rBtn.y - rBtn.h/2 && mouseY < rBtn.y + rBtn.h/2) {
      win = false;
      gameover = false;
      collectedLetters = [];
      meteors = [];
      letterMeteors = [];
      rocket = new Rocket();
      for (let i = 0; i < numMeteors; i++) {
        meteors.push(new Meteor());
      }
      shuffle(allLetters, true);
      for (let i = 0; i < 2; i++) {
        let letter = random(allLetters);
        letterMeteors.push(new LetterMeteor(letter));
      }
      gameState = "game";
      loop(); // 重新開始 draw
      return;
    }
    // 返回主頁
    if (hBtn && mouseX > hBtn.x - hBtn.w/2 && mouseX < hBtn.x + hBtn.w/2 &&
        mouseY > hBtn.y - hBtn.h/2 && mouseY < hBtn.y + hBtn.h/2) {
      win = false;
      gameover = false;
      collectedLetters = [];
      meteors = [];
      letterMeteors = [];
      rocket = new Rocket();
      gameState = "home";
      loop();
      return;
    }
  }
}

// 火箭類別
class Rocket {
  constructor() {
    this.x = width / 2;
    this.y = height - 80;
    this.r = 50; // 原本30，放大
    this.dir = 1;
    this.speed = 2;
  }
  update() {
    this.x += this.dir * this.speed;
    if (this.x < this.r || this.x > width - this.r) {
      this.dir *= -1;
      this.x = constrain(this.x, this.r, width - this.r);
    }
  }
  display() {
    push();
    translate(this.x, this.y);
    imageMode(CENTER);
    image(rocketImg, 0, 0, this.r * 2, this.r * 2); // 放大
    pop();
  }
  collide(meteor) {
    return dist(this.x, this.y, meteor.x, meteor.y) < this.r + meteor.r;
  }
}

// 隕石類別
class Meteor {
  constructor() {
    this.x = random(60, width - 60);
    this.y = random(-200, 0);
    this.r = random(35, 70); // 隨機大小，原本50
    this.speed = random(0.8, 1.8);
  }
  update() {
    this.y += this.speed;
    if (this.y > height + this.r) {
      this.x = random(60, width - 60);
      this.y = random(-200, 0);
      this.r = random(35, 70); // 重生時也隨機大小
      this.speed = random(0.8, 1.8);
    }
  }
  display() {
    imageMode(CENTER);
    image(planetMeteorImg, this.x, this.y, this.r * 2, this.r * 2);
  }
}

class LetterMeteor {
  constructor(letter) {
    this.letter = letter;
    this.x = random(60, width - 60);
    this.y = random(-height, 0);
    this.r = random(35, 70); // 隨機大小，原本50
    this.speed = random(0.8, 1.8);
    this.c = color(random(100,255), random(100,255), random(100,255));
  }
  update() {
    if (grabbedMeteor !== this) {
      this.y += this.speed;
    }
    if (this.y > height + this.r) {
      this.letter = random(allLetters);
      this.x = random(60, width - 60);
      this.y = random(-200, 0);
      this.r = random(35, 70); // 重生時也隨機大小
      this.speed = random(0.8, 1.8);
    }
  }
  display() {
  fill(this.c);
  noStroke();
  ellipse(this.x, this.y, this.r * 2);
  fill(255);
  textSize(map(this.r, 35, 70, 32, 64));
  textAlign(CENTER, CENTER);
  push();
  translate(this.x, this.y);
  scale(-1, 1); // 局部反轉回正
  text(this.letter, 0, 0);
  pop();
}
}