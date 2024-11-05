require('dotenv').config();

const app = require('./app.js');
const port = process.env.PORT || 5002;

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
