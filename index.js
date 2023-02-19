const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const { QuickDB } = require('quick.db');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

// Public Folder
app.use(bodyParser.json());

function connectDatabase() {
    let conn = new QuickDB();

    return conn;
}

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/assets/index.fd498406.js', async (req, res) => {
    res.sendFile(__dirname + '/assets/index.fd498406.js');
});

app.get('/assets/index.77c0fa5b.css', async (req, res) => {
    res.sendFile(__dirname + '/assets/index.77c0fa5b.css');
});

//? Bütün ürünleri listeler
app.get('/products', async (req, res) => {
    let db = connectDatabase();

    let products = await db.get('products') || [];
    res.json({products: products.map(v => ({id: v.id, title: v.title, price: v.price}))});
});

//? Sipesifik ürünleri listeler
app.post('/products1', async (req, res) => {
    let db = connectDatabase();
    let ids = req.body.ids;
    let products = await db.get('products') || [];
    let result = products.filter(v => ids.includes(v.id));

    res.json({
        products: result,
        message: "Ürünler listelendi."
    })
});

//? Yeni ürün ekler
app.post('/addproduct', async (req, res) => {
    let db = connectDatabase();
    let products = await db.get('products') || [];
    let last = products.length + 1;
    let {title, prod_code, price, stock, details} = req.body;

    await db.push('products', {
        id: last,
        title: title,
        prod_code: prod_code,
        price: price,
        stock: stock,
        details: details
    });
    
    res.json({message: "Ürün eklendi."});
});

//? Login
app.post('/login', async (req, res) => {
    let db = connectDatabase();

    let users = await db.get('users') || [];

    let user = users.find(v => v.username === req.body.username && v.password === req.body.password) || undefined;

    if (user) {
        res.json({logined: true, message: "Giriş yapıldı.", token: user.token});
    } else {
        res.json({logined: false, message: "Hesap bulunamadı."});
    }
});

//? Register
app.post('/register', async (req, res) => {
    let db = connectDatabase();
    let {username, name_surname, mail, password, address} = req.body;

    let users = await db.get('users') || [];

    let cond = users.find(v => v.username === username || v.mail === mail) || false;

    if (cond) {
        res.json({logined: false, message: "Kullanıcı adı veya Mail adresi ile zaten kullanılmış."});
    } else {
        const rand = () => Math.random(0).toString(36).substr(2);
        const getToken = length => (rand() + rand() + rand() + rand()).substr(0, length);
        let token = getToken(32);

        await db.push('users', {
            username: username,
            name_surname: name_surname,
            mail: mail,
            role: "admin",
            password: password,
            address: address,
            token: token
        });

        res.json({logined: true, message: "Hesap açıldı. Giriş Yapıldı", token: token});
    }
});

//? Get User Datas
app.get('/auth', async (req, res) => {
    let authToken = req.query.authToken;
    let db = connectDatabase();

    if (authToken) {
        const users = await db.get('users') || [];
        const user = users.find(v => v.token === authToken) || undefined;
        if (user) {
            res.json({
                verified: true,
                message: "İlgili kullanıcı bilgileri bulundu.",
                user: {
                    id: user.id,
                    username: user.username,
                    name_surname: user.name_surname,
                    role: user.role,
                    mail: user.mail,
                    address: user.address
                }
            })
        } else {
            res.json({
                verified: false,
                message: "Token yanlış eksik veya sen bir hackersın."
            })
        }
    } else {
        res.json({ verified: false, message: "authToken gönderilmemiş." });
    }
})

app.listen(3000, () => {
    console.log('Server is started at port 3000');
});
