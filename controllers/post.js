import { db } from "../connect.js"
import  jwt  from "jsonwebtoken"
import  moment  from "moment"

export const getPosts = (req, res) => {
    const userid = req.query.userid
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json("Not logged in")

    jwt.verify(token, "secretkey", (err, userInfo) => {
        if (err) return res.status(403).json("Token is not valid")

        const q = userid !== "undefined"
        ? `SELECT p.*, u.id AS userid, name, profilePic FROM posts AS p JOIN users AS u ON (u.id = p.userid) WHERE p.userid=? ORDER BY p.createdAt DESC` 
        : `SELECT p.*, u.id AS userid, name, profilePic FROM posts AS p JOIN users AS u ON (u.id = p.userid) LEFT JOIN relationships AS r ON (p.userid = r.followedUserid) WHERE r.followerUserid = ? OR p.userid = ? ORDER BY p.createdAt DESC`;

        const values = userid !== "undefined" ? [userid] : [userInfo.id,userInfo.id]

        db.query(q, values, (err, data) => {
            if (err) return res.status(500).json(err);
            return res.status(200).json(data);
        })
    })

}

export const addPost = (req, res) => {

    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json("Not logged in")

    jwt.verify(token, "secretkey", (err, userInfo) => {
        if (err) return res.status(403).json("Token is not valid")

        const q = "INSERT into posts (`desc`, `img`, `createdAt`,`userid`) VALUES (?)";

        const values = [
            req.body.desc,
            req.body.img,
            moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
            userInfo.id
        ]

        db.query(q, [values], (err, data) => {
            if (err) return res.status(500).json(err);
            return res.status(200).json("Post created!");
        })
    })

}

export const deletePost = (req, res) => {

    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json("Not logged in")

    jwt.verify(token, "secretkey", (err, userInfo) => {
        if (err) return res.status(403).json("Token is not valid")

        db.query("DELETE FROM comments WHERE postid = ?", [req.query.postid], (err, data) => {
            if (err) return res.status(500).json(err);
          
            const q = "DELETE FROM posts WHERE `id`=? AND `userid`=?";

            db.query(q, [req.query.postid, userInfo.id], (err, data) => {
                if (err) return res.status(500).json(err);
                if(data.affectedRows>0) return res.status(200).json("Post Deleted!");
                return res.status(403).json("you can delete only your post")
            })

        });

    })

}