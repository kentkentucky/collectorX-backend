const mongoose = require("mongoose");
const { Chat } = require("../db/mongodb");

const getChats = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  try {
    const chats = await Chat.find({
      participants: { $in: [new mongoose.Types.ObjectId(id)] },
    }).populate("participants");
    const filteredChats = chats.map((chat) => {
      return {
        ...chat.toObject(), // Convert Mongoose document to plain object
        participants: chat.participants.filter(
          (participant) => participant._id.toString() !== id
        ),
      };
    });
    res.json(filteredChats);
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

const getChatroom = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const { chatID } = req.query;
  try {
    const chatroom = await Chat.findById(chatID).populate({
      path: "participants",
      select: "_id username image",
    });
    const otherParticipant = chatroom.participants.find(
      (p) => p._id.toString() !== id
    );
    res.json(otherParticipant);
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

const updateChat = async (req, res) => {
  const { chatID, lastMessage, timestamp } = req.body;
  try {
    const updateChat = await Chat.findByIdAndUpdate(chatID, {
      lastMessage,
      updatedAt: timestamp,
    });
    if (updateChat) {
      res.status(200).json("Successfully updated chat");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

module.exports = { getChats, getChatroom, updateChat };
