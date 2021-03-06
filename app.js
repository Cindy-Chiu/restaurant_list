// require packages used in the project
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const port = 3000
const exphbs = require('express-handlebars')
const Restaurant = require('./models/restaurant')
const app = express()




app.engine('handlebars', exphbs({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')
app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: true }))
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

// 取得資料庫連線狀態
const db = mongoose.connection
// 連線異常
db.on('error', () => {
  console.log('mongodb error!')
})
// 連線成功
db.once('open', () => {
  console.log('mongodb connected!')
})

// routes setting
app.get('/', (req, res) => {

  Restaurant.find()
    .lean()
    .then(restaurants => {
      res.render('index', { restaurants })
    })
    .catch(error => console.log(error))
})

app.get('/restaurants/new', (req, res) => {
  return res.render('new')
})

app.post('/restaurants', (req, res) => {
  let nowTime = new Date()
  let newId = Number(nowTime.getFullYear().toString() + nowTime.getMonth().toString() + nowTime.getDate().toString() + nowTime.getHours().toString() + nowTime.getMinutes().toString()) //取當前時間資料作為id基值，可避免每次啟動伺服器並新增餐廳時給予重複的id
  const { name, name_en, category, image, location, phone, google_map, rating, description } = req.body
  const id = newId
  newId = newId + 1
 

  return Restaurant.create({ id, name, name_en, category, image, location, phone, google_map, rating, description }) // 存入資料庫
    .then(() => res.redirect('/')) // 新增完成後導回首頁
    .catch(error => console.log(error))
})

app.get('/restaurants/:restaurant_id', (req, res) => {
  const id = Number(req.params.restaurant_id)
  return Restaurant.findOne({ id: id })
    .lean()
    .then((restaurant) => res.render('show', { restaurant }))
    .catch(error => console.log(error))
})


app.get('/search', (req, res) => {
  const keyword = req.query.keyword
  const regex = new RegExp(keyword, 'i') // i for case insensitive
  return Restaurant.find({ $or: [{ name: { $regex: regex } }, { category: { $regex: regex } }, { name_en: { $regex: regex } }] })
    .lean() //用關鍵字搜尋餐廳時可以輸入名稱、英文名稱、餐廳分類來搜尋並且不分字母大小寫
    .then((restaurants) => res.render('index', { restaurants: restaurants, keyword: keyword }))
    .catch(error => console.log(error))
})

app.get('/restaurants/:restaurant_id/edit', (req, res) => {
  const id = Number(req.params.restaurant_id)
  return Restaurant.findOne({ id: id })
    .lean()
    .then((restaurant) => res.render('edit', { restaurant }))
    .catch(error => console.log(error))
})


app.post('/restaurants/:restaurant_id/edit', (req, res) => {
  const id = Number(req.params.restaurant_id)
  const { name, name_en, category, image, location, phone, google_map, rating, description } = req.body

  return Restaurant.findOne({ id: id })
    .then(restaurant => {
      console.log(id)
      restaurant.name = name
      restaurant.name_en = name_en
      restaurant.category = category
      restaurant.image = image
      restaurant.location = location
      restaurant.phone = phone
      restaurant.rating = rating
      restaurant.google_map = google_map
      restaurant.description = description
      return restaurant.save()
    })
    .then(() => res.redirect(`/restaurants/${id}`))
    .catch(error => console.log(error))
})

app.post('/restaurants/:restaurant_id/delete', (req, res) => {

  const id = Number(req.params.restaurant_id)
  return Restaurant.findOne({ id: id })
    .then(restaurant => restaurant.remove())
    .then(() => res.redirect('/'))
    .catch(error => console.log(error))
})



// start and listen on the Express server
app.listen(port, () => {
  console.log(`Express is listening on localhost:${port}`)
})
