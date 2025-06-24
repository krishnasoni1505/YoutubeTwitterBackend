import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const pipeline = [];

    // created search index in mongodb atlas with fields as title and description
    
    if (query?.trim()) {
        pipeline.push({
            $search: {
                index: "video-search",      // name of search index
                text: {
                    query: query,
                    path: ["title", "description"]      //search only on title, description
                }
            }
        });
    }

    if(userId?.trim()){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid User Id")
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // fetching only those videos that have isPublished as true
    pipeline.push({
        $match: {
            isPublished: true
        }
    });

    if(sortBy?.trim() && sortType?.trim()){
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc"? 1 : -1        //sortBy can be views, createdAt, duration
            }
        })
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: {
                    $project: {
                        username: 1,
                        avatar: 1
                    }
                }
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = await Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Videos fetched successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(title?.trim() === ""){
        throw new ApiError(401, "Title cannot be empty")
    }
    if(description?.trim() === ""){
        throw new ApiError(401, "Descripition cannot be empty")
    }

    const localVideoPath = req.files?.videoFile?.[0]?.path
    const localThumbnailPath = req.files?.thumbnail?.[0]?.path

    if(!localVideoPath){
        throw new ApiError(400, "Video file is required")
    }
    if(!localThumbnailPath){
        throw new ApiError(400, "Thumbnail file is required")
    }

    const thumbnail = await uploadOnCloudinary(localThumbnailPath)
    const videoFile = await uploadOnCloudinary(localVideoPath)

    if(!videoFile || !thumbnail){
        throw new ApiError(400, "video and thumbnail are required")
    }

    const video = await Video.create(
        {
            videoFile: {
                public_id: videoFile.public_id,
                url: videoFile.url
            },
            thumbnail: {
                public_id: thumbnail.public_id,
                url: thumbnail.url
            },
            title,
            description,
            duration: videoFile.duration,
            owner: req.user?._id
        }
    )

    const createdVideo = await Video.findById(video._id)

    if(!createdVideo){
        throw new ApiError(500, "Something went wrong while uploading video to database")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, createdVideo, "Video published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers" 
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [req.user?._id, "$subscribers.subscriber"]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username:1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ])

    if(!video?.length){
        throw new ApiError(500, "Failed to fetch video")
    }

    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1        // to increase the view count by one
        }
    })

    await User.findByIdAndUpdate(req.user?._id,
        {
            $addToSet: {
                watchHistory: videoId       // adding video to user's watch history if not already present
            }
        }
    )

    return res.status(200)
    .json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id")
    }

    const {title, descripition} = req.body
    
    if(!(title?.trim() && descripition?.trim())){
        throw new ApiError(402, "Title and description are neeeded")
    }

    const video = await Video.findById(videoId)

    const thumbnailToDelete = video.thumbnail.public_id;

    if(!video){
        throw new ApiError(404, "No video found");
    }

    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401, "Unauthorized request, only video owner can edit video details")
    }

    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath){
        throw new ApiError(402, "Thumbnail is required")
    }
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(500, "Error in uploading to cloudinary")
    }

    const updatedVideo = await findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail:{
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                },
                title,
                descripition
            }
        },
        {
            new: true
        }
    )

    if(!updatedVideo){
        throw new ApiError(500, "Something went wrong while updating database")
    }

    await deleteFromCloudinary(thumbnailToDelete); // delete old thumbnail file

    return res
    .status(200)
    .json(
        new ApiResponse(2000, updatedVideo, "video updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(req.user?._id.toString() !== video?.owner.toString()){
        throw new ApiError(401, "Bad request, only owner can delete a video they published")
    }

    const videoDeleted = await Video.findByIdAndDelete(video?._id);

    if (!videoDeleted) {
        throw new ApiError(500, "Failed to delete the video please try again");
    }

    // delete video's thumbnail and videoFile from cloudinary
    await deleteFromCloudinary(video.thumbnail.public_id)
    await deleteFromCloudinary(video.videoFile.public_id, "video")

    // delete video likes
    await Like.deleteMany({
        video: video?._id
    })

    // delete video comments
    await  Comment.deleteMany({
        video: video?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(req.user?._id.toString() !== video?.owner.toString()){
        throw new ApiError(401, "Bad request, only owner can toggle the publish status of their video")
    }

    const toggledVideo = await Video.findByIdAndUpdate(
        video?._id,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        {
            new: true
        }
    )

    if(!toggledVideo){
        throw new ApiError(500, "Error while toggling publish status please try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, toggledVideo, "Publish status toggled successfully")
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}