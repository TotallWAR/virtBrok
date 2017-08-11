# virtBrok
Виртуальный брокер для взаимодействия с личным кабинетом пользователя - инвестора.

## API ROUTES

### USER ROUTES
-----

#### **Получение информации о пользователе**
| URL | Method | Param | Response|
| --- | --- | --- | --- |
| '/getUserInfo' | GET | userId | Object |

**Пример запроса:**
    `http://localhost:4000/getUserInfo/alex123`

**Пример ответа:**
```json
{
    "_id": "597b076753fd4634f38b36d4",
    "userId": "5979b665f747076eee861a89",
    "userName": "alex",
    "balance": 100000,
    "cash": 99548.108,
    "__v": 1,
    "tickers": [
        {
            "tickerId": 39036,
            "amount": 8,
            "companyName": "АЛРОСА"
        },
        {
            "tickerId": 39040,
            "amount": 4,
            "companyName": "НЛМК"
        },
        {
            "tickerId": 39050,
            "amount": 4,
            "companyName": "РАСПАДСКАЯ"
        }
    ]
}
```


#### **Получение пользовательских заказов**

| URL | Method | Param | Response|
| --- | --- | --- | --- |
| '/getUserOrders' | GET | userId | Array |

**Пример запроса:**       `http://localhost:4000/getUserOrders/alex123`
**Пример ответа:**

```json
[
    {
        "_id": "596352abfdcd4ce09a04fb00",
        "reason": null,
        "status": "done",
        "type": "buy",
        "userId": "alex123",
        "__v": 0,
        "summPrice": 412.11600000000004,
        "tickers": [
            {
                "tickerId": "38832",
                "amount": 8
            },
            {
                "tickerId": "87530",
                "amount": 4
            },
            {
                "tickerId": "38263",
                "amount": 4
            }
        ],
        "date": "2017-07-10T10:10:51.293Z"
    },
    {
        "_id": "596352acfdcd4ce09a04fb01",
        "reason": "Not enough cash",
        "status": "declined",
        "type": "buy",
        "userId": "alex123",
        "__v": 0,
        "tickers": [
            {
                "tickerId": "38832",
                "amount": 8
            },
            {
                "tickerId": "87530",
                "amount": 4
            },
            {
                "tickerId": "38263",
                "amount": 4
            }
        ],
        "date": "2017-07-10T10:10:52.075Z"
    }
]
```


### Broker Routes
-----

#### **Создание счета:**

| URL | Method | Body | Response|
| --- | --- | --- | --- |
| '/openBill' | POST | Object | Text |

**Пример запроса:**
    `http://localhost:4000/openBill`

**Body запроса:**
```json
{
	"userId":"alex124",
	"userName":"alex",
	"cash":1000
}
```

**Пример ответа:**
`"The bill is created successfully."`


#### **Покупка/продажа бумаг (создание ордера)**

URL | Method | Body | Response|
| --- | --- | --- | --- |
| '/createOrderRequest' | POST | Object | Text |

**Пример запроса:**
    `http://localhost:4000/createOrderRequest`

**Body запроса:**
```json
{ "userId":"alex123",
"type": "buy",
"tickers" : [
	{"tickerId": "38832", "amount":8},
	{"tickerId" :"87530", "amount":4},
	{"tickerId": "38263", "amount":4}
]
}
```

**Пример ответа:**
    `"The trade session has not been started yet. Order has been queued."`




#### **Пополнение кеша**
**Комментарий**: Ордер будет выполнен на следующий день в начале торговой сессии
| URL | Method | Body | Response|
| --- | --- | --- | --- |
| '/refillAccount' | POST | Object | Text |

**Пример запроса:**
    `http://localhost:4000/refillAccount`

**Body запроса:**
```json
{
  "userId":"5975da6f0de4749954eef09d",
	"cash": "300"
}
```

**Пример ответа:**
`"Order has beed queued. It will be executed during the next trade session."`


#### **Снятие кеша**
**Комментарий**: Ордер будет выполнен на следующий день в начале торговой сессии
| URL | Method | Body | Response|
| --- | --- | --- | --- |
| '/replenishAccount' | POST | Object | Text |

**Пример запроса:**
    `http://localhost:4000/replenishAccount`

**Body запроса:**
```json
{
  "userId":"5975da6f0de4749954eef09d",
	"cash": "300"
}
```

**Пример ответа:**
`"Order has beed queued. It will be executed during the next trade session."`


Замечания:
-----
* тип заказа может быть `sell` или `buy`
* при недостаточном количестве кеша или бумаг будут возвращены `400`-ые ошибки c соответствующим описанием
* если в данный момент не торговая сессия, заказы будут поставлены в очередь и исполнены, как только начнется торговая сессия
