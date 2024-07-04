// middleware for authentication
export const authenticateUser = (req, res, next) => {
        if (req.session && req.session.user) {
        next();
        } else {
        res.status(401).json({ error: 'Unauthorized' });
        }
    };
    