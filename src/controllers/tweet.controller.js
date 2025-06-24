import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    
    if(content?.trim() === ""){
        throw new ApiError(401, "Content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    const tweetCreated = await Tweet.findById(tweet._id)

    if(!tweetCreated){
        throw new ApiError(500, "Something went wrong while creating tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweetCreated, "Tweet created successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails"
                },
                ownerDetails: {
                    $first: "$ownerDetails"
                },
                isLiked: {
                    if: {
                        $in: [req.user?._id, "$likeDetails.likedBy"]
                    },
                    then: true,
                    else: false
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            }
        }
    ])

    if(!tweets?.length){
        throw new ApiError(404, "No tweets found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {updatedContent} = req.body
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(401, "Invalid Tweet Id")
    }
    if(updatedContent?.trim() === ""){
        throw new ApiError(401, "Content is required")
    }
    
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Only tweet owner can edit their tweet");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: updatedContent
            }
        },
        {
            new: true
        }
    )

    if(!updatedTweet){
        throw new ApiError(500, "Something went wrong while updating a tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401, "Invalid Tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(402, "Only tweet owner can delete their tweet")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    
    if(!deletedTweet){
        throw new ApiError(500, "Something went wrong while deleting a tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}