const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

// Public Folder
app.use(bodyParser.json());

function connectDatabase() {
    let con = mysql.createConnection({
        host: "", // MySQL hostname
        user: "", // MySQL Username
        password: "", // MySQL Password
        database: "" // MySQL Database Name
    });

    con.connect((err) => {
        if (err) throw err;
    });

    return con;
}

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/assets/index.4c45e0dd.js', async (req, res) => {
    res.sendFile(__dirname + '/assets/index.4c45e0dd.js');
});

app.get('/assets/index.77c0fa5b.css', async (req, res) => {
    res.sendFile(__dirname + '/assets/index.77c0fa5b.css');
});

//? Bütün ürünleri listeler
app.get('/products', async (req, res) => {
    let conn = connectDatabase();
    conn.query('select * from products', (err, result) => {
        if (err) return res.json({message: err.toString()});
        res.json({products: result.map(v => JSON.parse(JSON.stringify({id: v.id, title: v.title, price: v.price})))});
    })
});

//? Sipesifik bir ürünün özelliklerini verir
app.get('/product', async (req, res) => {
    let conn = connectDatabase();
    conn.query(`select * from products where id=${Number(req.query.id)}`, (err, result) => {
        if (err) return res.json({message: err.toString()});
        res.json(result[0]);
    })
});

//? Sipesifik ürünleri listeler
app.post('/products1', async (req, res) => {
    let conn = connectDatabase();
    let ids = req.body.ids;
    let sql = `select * from products where id in (${ids.join(',')})`;
    conn.query(sql, (err, result) => {
        res.json({
            products: result,
            message: err ? err.toString() : "Ürünler listelendi."
        })
    });
});

//? Yeni ürün ekler
app.post('/addproduct', async (req, res) => {
    let conn = connectDatabase();
    conn.query(`insert into products (title, prod_code, price, stock, details) values (?, ?, ?, ?, ?)`, [req.body.title, req.body.prod_code, req.body.price, req.body.stock, req.body.details], (err, result) => {
        if (err) return res.json({message: err.toString()})
        res.json({product: result});
    })
});

//? Login
app.post('/login', async (req, res) => {
    let conn = connectDatabase();
    conn.query(`select * from users where username=? and password=?`, [req.body.username, req.body.password], (err, result) => {
        if (err) return res.json({logined: false, message: err.toString()});
        if (result[0]) {
            res.json({logined: true, message: "Giriş yapıldı.", token: result[0].token});
        } else {
            res.json({logined: false, message: "Hesap bulunamadı."});
        }
    })
});

//? Register
app.post('/register', async (req, res) => {
    let conn = connectDatabase();
    let {username, name_surname, mail, password, address} = req.body;
    conn.query(`select * from users where username=? or mail=?`, [username, mail], async (err, r) => {
        if (r.length === 0) { // Hesap açılabilir
            const rand = () => Math.random(0).toString(36).substr(2);
            const getToken = length => (rand() + rand() + rand() + rand()).substr(0, length);
            let token = getToken(32);
            conn.query(`insert into users (username, name_surname, mail, password, address, token) values (?, ?, ?, ?, ?, ?)`, [username, name_surname, mail, password, address, token], async (err, result) => {
                res.json({logined: true, message: "Hesap açıldı. Giriş Yapıldı", token: token});
            })
        } else { // Kullanıcı adı veya Mail zaten kullanılmış
            res.json({logined: false, message: "Kullanıcı adı veya Mail adresi ile zaten kullanılmış."})
        }
    })
});

//? Get User Datas
app.get('/auth', async (req, res) => {
    let authToken = req.query.authToken;
    let conn = connectDatabase();
    if (authToken) {
        conn.query(`select * from users where token=?`, [authToken], async (err, result) => {
            if (result[0]) {
                res.json({
                    message: "İlgili kullanıcı bilgileri bulundu.",
                    verified: true,
                    user: {
                        id: result[0].id,
                        username: result[0].username,
                        name_surname: result[0].name_surname,
                        role: result[0].role,
                        mail: result[0].mail,
                        address: result[0].address
                    }
                })
            } else {
                res.json({ verified: false,message: "token yanlış veya eksik." })
            }
        })
    } else {
        res.json({ verified: false, message: "authToken gönderilmemiş." })
    }
})

app.listen(3000, () => {
    console.log('Server is started at port 3000');
});
