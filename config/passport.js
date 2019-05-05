import passport from "passport";

const LocalStrategy = require("passport-local").Strategy;

const init = () => {
    passport.use(
        new LocalStrategy(
            {
                usernameField: "user"
            },
            async (username, password, done) => {
                // TODO: Implementar esto
               /*  const { nombre, cedula2 } = response;
                const user = await Agent.findOne({ dni: cedula2 });
                if (user) {
                    return done(null, { _id: user._id, name: nombre.trim(), dni: cedula2.trim() });
                } else {
                    return done("User not registered in MedicalManager");
                } */
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });
}

export default { init }