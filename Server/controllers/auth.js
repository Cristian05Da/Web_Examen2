// Importar el modelo usuario 
const User = require("../models/user");
// Importar libreria bcryptjs 
const bcrypt = require("bcryptjs");
// Importar modelo jwt
const jwt = require("../utils/jwt");
const user = require("../models/user");

async function register(req, res) {
    const { firstname, lastname, email, password } = req.body;

    if (!email) return res.status(400).send({ msg: "El email es obligatorio" });
    if (!password) return res.status(400).send({ msg: "La contraseña es obligatoria" });

    const user = new User({
        firstname,
        lastname,
        email: email.toLowerCase(),
        role: "user",
        active: false,
    });

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);
    user.password = hashPassword;

    try {
        await user.save();
        res.status(200).send({ msg: "Usuario guardado" });
    } catch (err) {
        res.status(400).send({ msg: `Error al crear el usuario: ${err.message}` });
    }
}

async function login(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ msg: "El email es obligatorio" });
    if (!password) return res.status(400).send({ msg: "La contraseña es obligatoria" });

    const emailLowerCase = email.toLowerCase();

    try {
        const userStore = await User.findOne({ email: emailLowerCase });

        if (!userStore) {
            res.status(400).send({ msg: "Usuario no encontrado" });
            return;
        }

        const check = await bcrypt.compare(password, userStore.password);

        if (!check) {
            res.status(400).send({ msg: "Contraseña incorrecta" });
            return;
        }

        if (!userStore.active) {
            res.status(401).send({ msg: "Usuario no activo" });
            return;
        }

        res.status(200).send({ 
            acces: jwt.createAccessToken(userStore),
            refres: jwt.createAccessToken(userStore),
        });
    } catch (error) {
        res.status(500).send({ msg: `Error del servidor: ${error.message}` });
    }
}
// fucion para refrescar token

async function refreshAccessToken(req, res) {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ msg: "Token requerido" });
    }

    try {
        const { user_id } = jwt.decoded(token);
        const userStorage = await User.findOne({ _id: user_id });

        if (!userStorage) {
            return res.status(404).send({ msg: 'Usuario no encontrado' });
        }

        const accessToken = jwt.createAccessToken(userStorage);
        res.status(200).send({ accessToken });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: 'Error del servidor' });
    }
}
module.exports = {
    register,
    login,
    refreshAccessToken,
};
