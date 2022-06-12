
const express = require('express');
const axios = require('axios');
const {uuid} = require("uuidv4");
const { mongoClient } = require('./mongo');
const bodyParser = require('body-parser')


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// /*app.post('/orders', async (req,res) => {
//   const db = await mongoClient();
//   if (!db) res.status(500).send('Systems Unavailable');*/

//   /*
//     amount,
//     product_id
//   */
//   const amount = req.body.amount;

//   // 0. call payments microservice
//   const { data: paymentsResponse } = await axios.post('//urlshahd', {
//     amount
//   });

//   if (!paymentsResponse.id) {
//     return res.send("Could not complete your order");
//   }

//   // 1. create unique order id - use UUID V4 package
//   const order_id = uuid();
 
//   // create an orders document and insert to data
//   const order = {
//     order_id,
//     amount,
//     stripe_payment_id: paymentsResponse.id
//   };
//   await db.collection('orders').insertOne(order); 
  
//   // 2. call /inventory microservice and pass the order_id
//   const { data: inventoryResponse } = await axios.post('https://goweather.herokuapp.com/weather/california/', {
//     product_id
//   });
//   // 3. call /shipments microservice and pass the order_id
//   const { data: shipmentsResponse } = await axios.post('https://goweather.herokuapp.com/weather/california/', {
//     order_id,
//     product_id
//   });

//   // 4. call /notifications microservice and pass the order_id
//   const { data: notificationResponse } = await axios.post('https://goweather.herokuapp.com/weather/california/', {
//     order_id,
//     product_id
//   });

//   // return the unique order id to client so they can check on status later
//   return res.send({
//     order_id
//   });

  // /*hena ana ayza a3mel elstatus*/////
  
  // app.get("/api/orders/:order_id", async (req, res) => {
  //   const db = await mongoClient();
  //   if (!db) res.status(500).send("Systems Unavailable");
  //   let order_ids = parseInt(req.params.order_id);
  
  //  const shipment = await db
  //     .collection("orders")
  //     .findOne({ order_id: order_ids });
  //   if (!shipment) {
  //     res.status(200).send({ message: "Order not found" });
  //   } else {
  //     res.status(200).send({ body: shipment, message: "Order retrived" });
  //   }
  // }); //zbaty dyy

app.post("/api/orders", async (req, res) => {
  try {
    const db = await mongoClient();
    if (!db) res.status(500).json("Systems Unavailable");

      const amount = req.body.amount;
      const email = req.body.email;
      const product_id = req.body.product_id;
      const name=req.body.name;
      const price=req.body.price;

      // 0. call payments microservice
      const { data: paymentsResponse } = await axios.post('https://payment-service.vercel.app/api/payments', {
        amount//,
        //email,
        //text: "Payments Successful"

      });
    
      if (!paymentsResponse.id) {
        return res.send("Could not complete your order");
      } 
      
      const order_id = uuid();
      const newOrderDocument = await db.collection("orders").insertOne({
        order_id,
        name,
        price,
      });      

    // 2. call /inventory microservice and pass the order_id
    const { data: inventoryResponse } = await axios.post('https://inventory-backend-weld.vercel.app/api/inventory', {
      product_id  
    });

    // 3. call /shipments microservice and pass the order_id
    const { data: shipmentsResponse } = await axios.post('https://shipping-one.vercel.app/api/shipments', {
      order_id
    });

    // 4. call /notifications microservice and pass the order_id
    const { data: notificationResponse } = await axios.post('https://finalnotification.vercel.app/api/notification ', {
    email,  
    text:"Your Product id is "+product_id+ "Your order id is: "+ order_id 
    });

    return res.status(200).json({
      body: newOrderDocument,
      message: "Successfully created order",
    });
  } catch (e) {
    console.log("[createShipment] e", e);
  }
});

app.delete("/api/orders/:order_id", async (req, res) => {
  const db = await mongoClient();
  const post = await db
    .collection("orders")
    .findOne({ order_id: parseInt(req.params.order_id) });

  if (!post) {
    return res.status(404).json({ msg: "Order not found" });
  } else {
    db.collection("orders").remove({
      order_id: parseInt(req.params.order_id),
    });

    res.json({ msg: "Order removed" });
  }
});

app.patch("/api/orders/:order_id", async (req, res) => {
  try {
    // const { order_id } = createShipment.order_id;
    const db = await mongoClient();
    const order_id = parseInt(req.params.order_id);

    const shipment = await db
      .collection("orders")
      .findOne({ order_id: order_id });
    if (!shipment) return res.status(200).json("could not find order_id");

   

    const currentOrderStatus = shipment.order_status;
    const nextShipmentStatus = {
      CREATED: "PROCESSED",
      PROCESSED: "FULLFILLED",
      FULLFILLED: "FULLFILLED",
    }[currentOrderStatus];

    const updatedDocument = await db
      .collection("orders")
      .updateOne(
        { order_id: order_id },
        { $set: { order_status: nextShipmentStatus } }
      );
    res.status(200).json({
      body: nextShipmentStatus,   
      message: "Successfully updated order status",
    });
  } catch (e) {
    console.log("[updateShipment] e", e);
  }
});

app.listen(3000);
