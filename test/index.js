const Spider = require('../src');

(async function main() {
  try {
    const spider = new Spider(74853);
    await spider.getCookies({
      username: '', // 请填写登录信息
      password: '' // 请填写登录信息
    });
    await spider.getList();
    await spider.download();
    console.log('全部视频下载完成！');
  } catch (error) {
    console.log(error);
  }
})()