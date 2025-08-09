import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)){
        throw new ApiError(401, "Invalid videoId")
    }

    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200, { isLiked: false})
        )
    }

    await Like.create(
        {
            video: videoId,
            likedBy: req.user?._id
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked: true})
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(401, "Invalid commentId")
    }

    const likedAlready = await Like.findOne(
        {
            comment: commentId,
            likedBy: req.user?._id
        }
    )

    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200, { isLiked: false})
        )
    }

    await Like.create(
        {
            comment: commentId,
            likedBy: req.user?._id
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked: true})
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(401, "Invalid tweetId")
    }

    const likedAlready = await Like.findOne(
        {
            tweet: tweetId,
            likedBy: req.user?._id
        }
    )

    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200, { isLiked: false})
        )
    }

    await Like.create(
        {
            tweet: tweetId,
            likedBy: req.user?._id
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked: true})
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    { $match: { isPublished: true } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    { $unwind: "$ownerDetails" },
                    {
                        $project: {
                            _id: 1,
                            "videoFile.url": 1,
                            "thumbnail.url": 1,
                            owner: 1,
                            title: 1,
                            description: 1,
                            views: 1,
                            duration: 1,
                            createdAt: 1,
                            isPublished: 1,
                            "ownerDetails.username": 1,
                            "ownerDetails.fullName": 1,
                            "ownerDetails.avatar.url": 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$likedVideos" },
        { $replaceRoot: { newRoot: "$likedVideos" } },
        { $sort: { createdAt: -1 } }
    ]);

    if (!likedVideos.length) {
        throw new ApiError(404, "No videos found");
    }

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}