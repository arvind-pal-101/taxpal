const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Check user exists
   const user = await User.findOne({ email });

if (!user) {
  //console.log("User not found");
  return res.status(400).json({ message: "Invalid credentials" });
}

/*console.log("User found:", user.email);
console.log("Entered password:", password);
console.log("Hashed password in DB:", user.password);*/

const isMatch = await bcrypt.compare(password, user.password);

//console.log("Is password match:", isMatch);

if (!isMatch) {
  return res.status(400).json({ message: "Invalid credentials" });
}


    // 3️⃣ Generate JWT
    const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

    res.status(200).json({
      message: "Login successful",
      token,
    });

  } catch (error) {
  console.log(error);   // 👈 ye add karo
  res.status(500).json({ message: "Server error" });
}

};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, country, income_bracket } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      country,
      income_bracket
    });

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = { loginUser, registerUser, forgotPassword  };
