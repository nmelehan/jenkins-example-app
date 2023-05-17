const express = require('express')
const app = express()

const HOST = '0.0.0.0'
const PORT = '3000'

const generateMessage = (recipientName) => {
  if (!recipientName) {
    recipientName = 'World'
  }

  return { message: 'Howdy, ' + recipientName + '!' }
}

app.get('/', (req, res) => {
  res.json(generateMessage())
})

app.get('/:name', (req, res) => {
  res.json(generateMessage(req.params.name))
})

app.listen(PORT, HOST)
console.log(`Running on http://${HOST}:${PORT}`)
