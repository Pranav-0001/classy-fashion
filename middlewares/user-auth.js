
module.exports = {
    userLogin: (req, res, next) => {
        let user = req.session.user
        if (user) {
            next()
        } else {
            res.redirect('/login')
        }
    }
}