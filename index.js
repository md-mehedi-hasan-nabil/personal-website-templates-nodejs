const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectID;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cors());
app.use(express.static('images'));
app.use(fileUpload());
app.use(express.static('pages'))

const port = process.env.PORT || 8080;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gid1g.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
client.connect(err => {
  const collection = client.db("personal-website").collection("personal-website-data");

  app.get('/show', (req, res) => {
    collection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });

  app.get('/image', (req, res) => {
    fs.readdir('./images', (err, files) => {
      let array = [];
      files.forEach(file => {
        const imageName = {
          name: file
        };
        array.push(imageName);
      });
      res.send(array);
    });
  });

  app.post('/uploadData', (req, res) => {
    const data = req.body;
    collection.insertOne(data)
      .then((result) => {
        res.send(true);
      });
    console.log(req.body);
  });

  app.post('/addPhoto', (req, res) => {
    const file = (req.files.file);
    const data = req.body;
    const allData = JSON.stringify({ ...data, file: file.name });
    console.log(data);

    file.mv(`${__dirname}/images/${file.name}`, err => {
      if (err) {
        return res.status(500).send({ message: "Failed to upload image..." });
      }
    });
    return res.send({ name: file.name, path: `/${file.name}` });
  });

  app.post('/addServices', (req, res) => {
    const data = req.body;
    collection.insertOne(data)
      .then((result) => {
        res.send(true);
        console.log(result);
      });
  });

  app.patch('/update/:id', (req, res) => {
    collection.updateOne({ _id: ObjectId(req.params.id) },
      {
        $set: { title: req.body.title, description: req.body.description }
      })
      .then(result => {
        console.log(result);
        res.send(true);
      })
  })

  app.delete('/delete/:id', (req, res) => {
    collection.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        console.log(result);
        res.send(true);
      })
  });

  app.delete('/delete/image/:imageName', (req, res) => {
    console.log(req.params.imageName);
    fs.unlink(`./images/${req.params.imageName}`, (err) => {
      if (err) throw err;
      console.log("photo deleted successfully");
      res.send(true);
    })
  });

  console.log('database connection succeeded');
  // client.close();
});

app.get('/', function (req, res) {
  fs.readFile('./pages/index.html', { encoding: 'utf-8' }, (err, data) => {
    if (!err) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(data);
      res.end();
    } else {
      res.send(err);
    }
  });
});

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
}); 