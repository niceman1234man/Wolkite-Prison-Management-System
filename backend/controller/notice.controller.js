import { Notice } from "../model/notice.model.js";


export const addNotice = async (req, res) => {
  try {
    const { title, description, roles, date, priority } = req.body;
    if (!title || !description || !roles.length || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const noticeDate = new Date(date);
    if (noticeDate < new Date()) {
      return res.status(400).json({ message: "Date must be in the future" });
    }

    const newNotice = new Notice({
      title,
      description,
      roles,
      date,
      priority: priority || "Normal",  
    });

    await newNotice.save();
    res.status(201).json({ success: true, message: "Notice Added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to post the notice", error: error.message });
  }
};


export const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find();
    if (!notices) {
      return res.status(400).json({ message: "Notice does not exist" });
    }

    res.status(200).json({ notices: notices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const {  title,
      description,
      roles,
      date,
      priority} = req.body;

    if (!title || !description || !roles || !date || !priority) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updateduser = await Notice.findByIdAndUpdate(
      id,
      {   title,
        description,
        roles,
        date,
        priority},
      { new: true} 
    );

    if (!updateduser) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.status(200).json({ data: updateduser, message: "Notice updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotice = await Notice.findByIdAndDelete(id);

    if (!deletedNotice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

 export const postNotice = async (req, res) => {
    try {
      const { id } = req.params;
      const { isPosted } = req.body;
      if (isPosted === undefined) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const postNotice = await Notice.findByIdAndUpdate(
        id,
        { isPosted },
        { new: true }
      );
  
      if (!postNotice) {
        return res.status(404).json({ message: "Notice not found" });
      }
  
      res.status(200).json({ data: postNotice, message: "Notice Posted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
export const getNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const noticeInfo = await Notice.findOne({ _id: id });
    if (!noticeInfo) {
      return res.status(400).json({ message: "Notice does not exist" });
    }

    res.status(200).json({ notice: noticeInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

