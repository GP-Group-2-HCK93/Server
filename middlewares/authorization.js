const guardAdmin = async (req, res, next) => {
  try {
    if (req.user.role === "Admin") {
      next();
    } else {
      throw { name: "Forbidden", message: `You're not authorized` };
    }
  } catch (error) {
    next(error)
  }
}

module.exports = guardAdmin