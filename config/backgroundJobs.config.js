'use strict';

module.exports = () => {
  const envCfg = require('./env/' + process.env.NODE_ENV + '.js');
  const monq = require('monq');
  const tradeSession = require('../app/vars').tradeSession;
  const client = monq(envCfg.dbURI + 'monqJobs');
  const CronJob = require('cron').CronJob;
  const checkStatusOrder = require('../app/backgroundJobs/checkingStatusOrder.job.js');
  const cashWithdrawal = require('../app/backgroundJobs/cashWithdrawal.job.js');
  const updateCompaniesTickers = require('../app/backgroundJobs/updateCompanies.job.js');

  //создаем очереди
  const queue = client.queue('Background_Tasks');

  //список job-ов
  const jobs = [{
    name: "checkingStatusOrder",
    jobCallback: checkStatusOrder.checkStatusOrder,
    typeOfQueue: "Background_Tasks",
    worker: () => {}
  }, {
    name: "cashWithdrawal",
    jobCallback: cashWithdrawal.checkCashWithdrawalOrders,
    typeOfQueue: "Background_Tasks",
    worker: () => {}
  }, {
    name: "updateCompanies",
    jobCallback: updateCompaniesTickers.updateCompanies,
    typeOfQueue: "Background_Tasks",
    worker: () => {}
  }];

  /*
   * Runs every weekday (Monday through Friday)
   * at 10:01:00 AM etc. It does not run on Saturday
   * or Sunday.
   */
  const timeline = [tradeSession.START_DAY_MOSCOW_TRADE_SESSION.getSeconds() + ' ' +
    tradeSession.START_DAY_MOSCOW_TRADE_SESSION.getMinutes() + ' ' +
    tradeSession.START_DAY_MOSCOW_TRADE_SESSION.getHours() + ' ' +
    '* * 1-5',
    tradeSession.START_EVENING_MOSCOW_TRADE_SESSION.getSeconds() + ' ' +
    tradeSession.START_EVENING_MOSCOW_TRADE_SESSION.getMinutes() + ' ' +
    tradeSession.START_EVENING_MOSCOW_TRADE_SESSION.getHours() + ' ' +
    '* * 1-5'
  ];

  //создание джобов и добавление их в очередь
  createJobs(queue, jobs);
  //старт джоба, который запускает очередь джобов
  startCronJob(jobs, timeline);


  function createJobs(queue, jobs) {
    jobs.forEach((job) => {
      let name = job.name || 'Default_Name';

      //кладем в очередь
      queue.enqueue(name, {
          text: "Test_Param"
        }, {
          attempts: {
            count: 1
          }
        },
        function(err, job) {
          console.log(new Date + ': enqueued:', name);
        });

      //создаем обработчика, который запускает джобы
      var worker = client.worker([job.typeOfQueue]);


      worker.register({
        [name]: job.jobCallback
      });

      worker
        .on('complete', function() {
          console.log('Job', job.id, 'with name', job.data.name, 'is done');
        })
        .on('error', function() {
          console.log('Job', job.id, 'with name', job.data.name, 'has failed');
        })
      job.worker = worker;
    });
  }

  /**
   * стартует все jobs
   * @param  [] jobs  массив объектов, содержащих имя и колбэк job-а
   */
  function processQueue(jobs) {
    jobs.forEach((job) => {
      job.worker.start();
    });
  }

  /**
   * Задает работу в определенное время (стартует очередь других работ)
   * @param  [] jobs  массив объектов, содержащих имя и колбэк job-а
   * @param  [] timeline массив строк времени, когда будут стартовать jobs
   */
  function startCronJob(jobs, timeline) {
    timeline.forEach((time) => {
      let cronJob = new CronJob({
        cronTime: time,
        onTick: () => processQueue(jobs),
        onComplete: () => console.log("CronJob is executed."),
        start: true,
        timeZone: 'Europe/Moscow'
      });
    });
  }
};
