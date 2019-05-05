import passport from 'passport';

const login = async (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            res.status(401).json(err);
            return;
        }

        if (user) {
            req.login(user, (err) => {
                req.session.last_user = user;
                req.session.last_login = new Date();
                if (err) return next(err);
                return res.json({ user });
            });
        } else {
            res.status(401).json(info);
        }
    })(req, res);
}

const isLoggedIn = async (req, res, next) => {
    authenticate(req, res, () => { res.status(200).json({ user: req.user }); });
}

const logout = async (req, res, next) => {
    req.logout();
    //req.session.destroy()
    res.sendStatus(401);
}

const authenticate = async (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.sendStatus(401);
}

export default { login, isLoggedIn, logout, authenticate };