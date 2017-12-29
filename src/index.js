const fs = require('fs');
const request = require('request');
const Nightmare = require('nightmare');

class Spider {
  constructor(courseId, startIndex, show) {
    if (!courseId) throw '课程Id为必需参数';
    if (!fs.existsSync('./videos')) fs.mkdirSync('./videos');
    this.courseId = courseId;
    this.cookies = [];
    this.list = [];
    this.currentIndex = startIndex || 0;
    this.nightmare = Nightmare({ show });
  }

  async getCookies(user) {
    console.log('开始获取cookies');
    const cookies = await this.nightmare
      .viewport(375, 667)
      .goto('https://login.m.taobao.com/login.htm')
      .type('#username', user.username)
      .type('#password', user.password)
      .click('#btn-submit')
      .wait(2000)
      .cookies.get();
    this.cookies = cookies;
    console.log('cookies获取成功！');
  }

  async getList() {
    console.log('开始获取视频列表');
    const list = await this.nightmare
      .cookies.set(this.cookies)
      .goto(`https://h5.m.taobao.com/app/xue/www/detail.htm?courseId=${this.courseId}`)
      .wait('.J_Item')
      .evaluate(() => {
        const items = document.querySelectorAll('.J_Item');
        return Array.from(items).map(item => ({
          uri: item.href,
          filename: item.children[0].innerText,
        }))
      });
    this.list = list;
    console.log('视频列表获取成功！');
  }

  download() {
    return new Promise(async (resolve, reject) => {
      const current = this.currentIndex;
      const total = this.list.length;
      if (current >= total) {
        this.nightmare.end();
        return resolve();
      }

      const { uri, filename } = this.list[current];
      const currentSrc = await this.nightmare
        .cookies.set(this.cookies)
        .goto(`https://h5.m.taobao.com/app/xue/www/detail.htm?courseId=${this.courseId}`)
        .wait('.J_Item')
        .click(`a[href="${uri.replace('https://h5.m.taobao.com/app/xue/www', '.')}"]`)
        .wait(2000)
        .evaluate(() => document.querySelector('#J_Video').currentSrc)
        .catch(err => reject(err));

      await this.nightmare.back();
      console.log(`开始下载 ${filename} ${current + 1}/${total}`);
      const stream = fs.createWriteStream(`./videos/${filename}.mp4`);
      request(currentSrc)
        .pipe(stream)
        .on('close', () => {       
          console.log(`${filename} 下载成功！`);
          this.currentIndex += 1;
          this.download();
        })
        .on('error', err => reject(err))
    });
  }
}

module.exports = Spider;
