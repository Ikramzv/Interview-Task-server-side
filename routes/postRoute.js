import express from "express";
import auth from "../auth/auth.js";
import Post from "../models/post.js";
import User from "../models/user.js";

const router = express.Router();

// Get all posts
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ pinned: -1 })
      .populate("userId")
      .populate("comments.userId");
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(403).send(error.message);
  }
});

// Create post
router.post("/posts", auth, async (req, res) => {
  const newPost = new Post({
    question: req.body.question,
    userId: req.user.id,
  });
  try {
    newPost.save(async (err, result) => {
      if (err) return err;
      const post = await result.populate("userId");
      // Increment user points by one
      await User.updateOne(
        { _id: req.user.id },
        {
          $inc: {
            points: 5,
          },
        }
      );
      return res.status(200).json(post);
    });
  } catch (error) {
    return res.status(403).send(error.message);
  }
});

// Add comment

router.patch("/comment/:postId", auth, async (req, res) => {
  const { postId } = req.params;
  const comment = {
    text: req.body.text,
    userId: req.user.id,
  };
  const post = await Post.findById(postId);
  if (!post) return res.status(403).send("Invalid Post ID");

  try {
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: comment },
      },
      { new: true }
    );
    // Increment user points
    await User.updateOne(
      { _id: req.user.id },
      {
        $inc: {
          points: 10,
        },
      }
    );
    return res.status(200).json(updatedPost);
  } catch (error) {
    return res.status(403).send(error.message);
  }
});

// Pin the post

router.patch("/pin_post/:postId", auth, async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return res.status(403).send("Invalid Post ID");
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $set: { pinned: !post?.pinned },
      },
      { new: true }
    );
    return res.status(200).json(updatedPost);
  } catch (error) {
    return res.status(403).send(error.message);
  }
});

// Edit post

router.patch("/edit_post/:postId", auth, async (req, res) => {
  const { postId } = req.params;
  const { question } = req.body;
  const post = await Post.findById(postId);
  if (!post) return res.status(403).send("Invalid Post ID");
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $set: { question },
      },
      { new: true }
    );
    return res.status(200).json(updatedPost);
  } catch (error) {
    return res.status(403).send(error.message);
  }
});

// Like post
router.patch("/like_post/:postId", auth, async (req, res) => {
  const { postId } = req.params;
  const user = req.user;
  try {
    const updatePost = await Post.updateOne({ _id: postId }, [
      {
        $set: {
          likes: {
            $cond: {
              if: {
                $in: [user.id, "$likes"],
              },
              then: {
                $setDifference: ["$likes", [user.id]],
              },
              else: {
                $concatArrays: ["$likes", [user.id]],
              },
            },
          },
        },
      },
    ]);
    return res.status(200).json(updatePost);
  } catch (error) {
    return res.status(400).send(error.message);
  }
});

export default router;
