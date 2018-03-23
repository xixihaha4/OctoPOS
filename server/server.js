const express = require('express');
const axios = require('axios');
const moment = require('moment');
const parser = require('body-parser');
const path = require('path');
const db = require('../database/models.js');
const Sequelize = require('sequelize');
const session = require('express-session');
const CronJob = require('cron').CronJob;


const Op = Sequelize.Op;

const app = express();

const sess = {
  secret: 'tyrell',
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: false,
  },
  rolling: true,
};

app.use(session(sess));

const port = 3000;

app.use(parser.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

//* **************************** MIDDLEWARE ************************************
let auth = function(req, res, next) {
  if (req.session.employee) {
    next();
  } else {
    res.status(401).send();
  }
};

//* **************************** POST REQUESTS *********************************
app.post('/test', (req, res) => {
  db.Category.create({ category_name: 'Test2Test' })
    .then(() => {
      res.send('success');
    });
});

app.post('/completed/transaction', (req, res) => {
  const itemList = [];
  for (let i = 0; i < req.body.transactionItems.length; i += 1) {
    itemList.push(req.body.transactionItems[i].id)
  }
  let type;
  if (req.body.type) {
    type = true;
  } else { type = false; }
  let employee = JSON.parse(req.session.employee)
  //let time = JSON.stringify(new Date).substring(1, 20);
  let time = JSON.stringify(moment().format());

  db.Sale.create({
    sale_date: time,
    item_id: JSON.stringify(itemList),
    employee_id: employee,
    sale_amount: parseFloat(req.body.total),
    sale_cost: 50,
    sale_discount: req.body.discount,
    sale_cash: type
  }).then(() => {
    res.send();
  })
});


app.post('/clockout', (req, res) => {
  db.Timesheet.update({
    check_out: moment().format('MM/DD/YYYY, hh:mm:ss a'),
  }, {
    where: {
      employee_id: req.session.employee,
      check_out: null,
    },
  })
    .then(() => {
      req.session.destroy();
      res.status(200).send();
    })
    .catch((error) => {
      throw error;
    });
});

app.post('/newEmployee', (req, res) => {
  db.Employee.create({
    employee_id: req.body.newEmployeeId,
    employee_name: req.body.newEmployeeName,
    manager_privilege: req.body.managerLevel,
  })
    .then(() => {
      res.status(201).send();
    })
    .catch((error) => {
      throw error;
    });
});


//* **************************** GET REQUESTS *********************************
// not working? attempt to redirect users who are not logged in

app.get('/fetch/items', (req, res) => {
  db.Item.findAll()
    .then((data) => {
      res.send(data);
    });
});

app.get('/fetch/categories', (req, res) => {
  db.Category.findAll()
    .then((data) => {
      res.send(data);
    });
});

app.get('/fetch/ingredients', (req, res) => {
  const ingredients = JSON.parse(req.query.item_ingredients);
  db.Ingredient.findAll({
    where: {
      id: {
        [Op.or]: ingredients,
      },
    },
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/currentInventory', (req, res) => {
  db.Order.findAll({
    attributes: ['order_name', 'order_initial', 'order_left', 'order_expire'],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/inventory', (req, res) => {
  db.Ingredient.findAll({
    attributes: ['ingredient_name', 'ingredient_left', 'ingredient_initial'],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/ordercost', (req, res) => {
  db.Order.findAll({
    attributes: ['order_date', 'order_total'],
    order: [['order_date', 'DESC']],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/inventorycost', (req, res) => {
  db.Ingredient.findAll({
    attributes: ['order_date', 'ingredient_total'],
    order: [['order_date', 'DESC']],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/waste', (req, res) => {
  db.Order.findAll({
    attributes: ['order_name', 'order_initial', 'order_left', 'order_used'],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/employee', (req, res) => {
  db.Employee.findAll({
    where: {
      employee_id: req.query.PIN,
    },
  })
    .then((data) => {
      if (data.length === 0) {
        // invalid login
        res.status(404).send();
      } else {
        req.session.regenerate(() => {
          req.session.employee = req.query.PIN;
          res.send(data);
        });
      }
    })
    .then(() => {
      db.Timesheet.create({
        employee_id: req.query.PIN,
        check_in: moment().format('MM/DD/YYYY, hh:mm:ss a'),
      });
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/fetch/employeeInfo', auth, (req, res) => {
  db.Employee.findAll({
    where: {
      employee_id: req.session.employee,
    },
  })
    .then((data) => {
      res.send(data[0]);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/fetch/timeSheet', auth, (req, res) => {
  db.Timesheet.findAll({
    where: {
      employee_id: req.query.employeeId,
    },
  })
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/fetch/allEmployees', (req, res) => {
  db.Employee.findAll({
    order: [['employee_name', 'ASC']],
  })
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/filter/category', auth, (req, res) => {
  db.Item.findAll({
    where: {
      item_category: req.query.category,
    },
  })
    .then((data) => {
      res.send(data);
    });
});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'), (err) => {
    if (err) res.status(500).send(err);
  });
});

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/dist/index.html'), (err) => {
//     if (err) res.status(500).send(err);
//   });
// });

app.post('/cronTest', (req, res) => {
  let currentTime = JSON.stringify(moment().format());
  currentTime = currentTime.substring(1, 11)
  let currentTimeParse = Date.parse(currentTime)
  let ingredients = [];
  let orders = [];
  let expired = [];
  let items = [];
  db.Ingredient.findAll({})
    .then((ing) => {
      ingredients = ing;
    }).then(() => {
      db.Order.findAll({
        where: { order_used: false },
        order: [['order_expire', 'ASC']]
      })
        .then((order) => {
          orders = order;
          console.log(orders, 'CRONCRONCRONCRONCRONCRON NEXT IS INGREDIENTS\n', ingredients)
          db.Item.findAll({})
          .then((menu) => {
            items = menu;
            for (let i = 0; i < ingredients.length; i += 1) {
              if (currentTimeParse > Date.parse(ingredients[i].ingredient_expire)) {
                expired.push(ingredients[i])
              }
            }

            for (let j = 0; j < expired.length; j += 1) {
              let foundIndex = orders.indexOf(orders.find((order, index) => {
                return order.order_name === expired[j].ingredient_name
              }))
              if (foundIndex === -1){
                for (let q = 0; q < items.length; q += 1) {
                  let ingredients = JSON.parse(items[q].item_ingredients);
                  let usesIngredient = ingredients.find(ing => {
                    return ing === expired[j].id
                  })
                  if(usesIngredient > -1) {
                    db.Item.update({
                      item_availability: false
                    },
                    { where: { item_name: items[q].item_name }}
                    )
                  }
                }
              } else {
                // expired item found at orders index foundIndex
                let temp = expired[j];
                db.Ingredient.update(
                  {
                    order_number: orders[foundIndex].order_number,
                    ingredient_left: orders[foundIndex].order_initial,
                    ingredient_initial: orders[foundIndex].order_initial,
                    unit_cost: orders[foundIndex].unit_cost,
                    ingredient_expire: orders[foundIndex].order_expire,
                    order_date: orders[foundIndex].order_date,
                    ingredient_total: orders[foundIndex].order_total,
                  },
                  { where: { ingredient_name: orders[foundIndex].order_name } },
                ).then(() => {
                  db.Order.update(
                    {
                    order_date: temp.order_date,
                    order_name: temp.ingredient_name,
                    order_number: temp.order_number,
                    order_initial: temp.ingredient_initial,
                    order_left: temp.ingredient_left,
                    unit_cost: temp.unit_cost,
                    order_expire: temp.ingredient_expire,
                    order_total: temp.ingredient_total,
                    order_used: 1,
                  },
                  { where: { order_number: orders[foundIndex].order_number }}
                ).then(() => {
                    res.send([orders, ingredients])
                  })
                })
              }
            }
          })
=======
          res.send([orders, ingredients])
>>>>>>> employeeCharts2
        });
    });
})


// ************************CRONJOB DONT TOUCH**********************/
const myCronJob = new CronJob('0 6 * * * *', () => {
  let currentTime = JSON.stringify(moment().format());
  currentTime = currentTime.substring(1, 11)
  let currentTimeParse = Date.parse(currentTime)
  let ingredients = [];
  let orders = [];
  let expired = [];
  let items = [];
  db.Ingredient.findAll({})
    .then((ing) => {
      ingredients = ing;
    }).then(() => {
      db.Order.findAll({
        where: { order_used: false },
        order: [['order_expire', 'ASC']]
      })
        .then((order) => {
          orders = order;
          db.Item.findAll({})
          .then((menu) => {
            items = menu;
            for (let i = 0; i < ingredients.length; i += 1) {
              if (currentTimeParse > Date.parse(ingredients[i].ingredient_expire)) {
                expired.push(ingredients[i])
              }
            }

            for (let j = 0; j < expired.length; j += 1) {
              let foundIndex = orders.indexOf(orders.find((order, index) => {
                return order.order_name === expired[j].ingredient_name
              }))
              if (foundIndex === -1){
                for (let q = 0; q < items.length; q += 1) {
                  let ingredients = JSON.parse(items[q].item_ingredients);
                  let usesIngredient = ingredients.find(ing => {
                    return ing === expired[j].id
                  })
                  if(usesIngredient > -1) {
                    db.Item.update({
                      item_availability: false
                    },
                    { where: { item_name: items[q].item_name }}
                    )
                  }
                }
              } else {
                // expired item found at orders index foundIndex
                let temp = expired[j];
                db.Ingredient.update(
                  {
                    order_number: orders[foundIndex].order_number,
                    ingredient_left: orders[foundIndex].order_initial,
                    ingredient_initial: orders[foundIndex].order_initial,
                    unit_cost: orders[foundIndex].unit_cost,
                    ingredient_expire: orders[foundIndex].order_expire,
                    order_date: orders[foundIndex].order_date,
                    ingredient_total: orders[foundIndex].order_total,
                  },
                  { where: { ingredient_name: orders[foundIndex].order_name } },
                ).then(() => {
                  db.Order.update(
                    {
                    order_date: temp.order_date,
                    order_name: temp.ingredient_name,
                    order_number: temp.order_number,
                    order_initial: temp.ingredient_initial,
                    order_left: temp.ingredient_left,
                    unit_cost: temp.unit_cost,
                    order_expire: temp.ingredient_expire,
                    order_total: temp.ingredient_total,
                    order_used: 1,
                  },
                  { where: { order_number: orders[foundIndex].order_number }}
                ).then(() => {
                    console.log('cronjobbeingrun')
                  })
                })
              }
            }
          })
        });
    });
}, null, true, 'America/Los_Angeles');
myCronJob.start();
// ************************NO TOUCH*******************************/

app.listen(port);
