const Contact = require("../models/contact");
const User = require("../models/user");

exports.getContacts = async (req, res) => {
    const userId = req.user.id

    try {
        // Retrieve user's contacts from database
        const contacts = await Contact.findAll({
            where: { ownerId: userId },
            include: [{
                model: User,
                attributes: [ 'imageProfile' ]
            }]
        });

        res.json({ contacts });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user's contacts.", error });
    }
};

exports.getContact = async (req, res) => {
    /**TODO: implement it */
};

exports.createContact = async (req, res) => {
    /**TODO: implement it */
};

exports.updateContact = async (req, res) => {
    /**TODO: implement it */
};

exports.deleteContact = async (req, res) => {
    /**TODO: implement it */
};

/*exports.syncContact = async (req, res) => {
    
};*/