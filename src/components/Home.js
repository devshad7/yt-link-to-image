'use client';

import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import download from "downloadjs";
import { toPng } from "html-to-image";

const Home = () => {
    const [video, setVideo] = useState(null);
    const [view, setView] = useState("");
    const [comment, setComment] = useState("");
    const [error, setError] = useState(null);
    const [authorImage, setAuthorImage] = useState(null);
    const videoUrl = "https://www.youtube.com/watch?v=k9ZAH37doTc";

    // download all as image
    const divRef = useRef(null);

    const handleDownload = async () => {
        if (divRef.current) {
            try {
                const dataUrl = await toPng(divRef.current);
                download(dataUrl, `${video.title}.png`);
            } catch (error) {
                console.error('Failed to download the image:', error);
            }
        }
    };

    // Helper function to extract YouTube video ID
    const getYouTubeVideoID = (url) => {
        const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    // Helper function to format views or comments
    const formatCount = (count) => {
        if (count >= 1_000_000) {
            return (count / 1_000_000).toFixed(1) + "M";
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + "K";
        } else {
            return count.toString();
        }
    };

    useEffect(() => {
        const videoID = getYouTubeVideoID(videoUrl);

        if (!videoID) {
            setError("Invalid YouTube URL");
            return;
        }

        const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
        const VIDEO_API_URL = `https://www.googleapis.com/youtube/v3/videos?id=${videoID}&part=snippet,contentDetails,statistics&key=${API_KEY}`;

        // Fetch video details
        fetch(VIDEO_API_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Error fetching video data: ${response.statusText}`);
                }
                return response.json();
            })
            .then((videoData) => {
                if (!videoData.items || videoData.items.length === 0) {
                    setError("Video not found");
                    return;
                }

                const videoDetails = videoData.items[0];
                console.log(videoDetails);

                setVideo({
                    title: videoDetails.snippet.title,
                    thumbnail: videoDetails.snippet.thumbnails.maxres.url,
                    comment: videoDetails.statistics.commentCount,
                    channelTitle: videoDetails.snippet.channelTitle,
                    channelId: videoDetails.snippet.channelId,
                });

                const viewCount = parseInt(videoDetails.statistics.viewCount, 10);
                const commentCount = parseInt(videoDetails.statistics.commentCount, 10);

                setView(formatCount(viewCount));
                setComment(formatCount(commentCount));

                // Fetch channel details for the author's image
                const CHANNEL_API_URL = `https://www.googleapis.com/youtube/v3/channels?id=${videoDetails.snippet.channelId}&part=snippet&key=${API_KEY}`;
                return fetch(CHANNEL_API_URL);
            })
            .then((channelResponse) => {
                if (!channelResponse.ok) {
                    throw new Error(`Error fetching channel data: ${channelResponse.statusText}`);
                }
                return channelResponse.json();
            })
            .then((channelData) => {
                if (channelData.items && channelData.items.length > 0) {
                    setAuthorImage(channelData.items[0].snippet.thumbnails.default.url);
                }
            })
            .catch((err) => {
                setError(err.message);
            });
    }, [videoUrl]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!video) {
        return <div>Loading...</div>;
    }

    return (
        <div className="h-screen w-full bg-black text-white flex flex-col justify-center items-center">
            <div className="flex flex-col items-center gap-2" ref={divRef}>
                <div className="bg-white text-black flex flex-col rounded-xl overflow-hidden gap-4">
                    <div className="h-auto w-96 md:w-[540px]">
                        <img
                            src={`/api/proxyImage?imageUrl=${encodeURIComponent(video.thumbnail)}`}
                            alt={video.title}
                        />
                    </div>
                    <div className="w-96 md:w-[540px] flex px-4 pb-4 gap-4">
                        {authorImage && (
                            <div className="size-16 md:size-12">
                                <img src={`/api/proxyImage?imageUrl=${encodeURIComponent(authorImage)}`} alt="Author's Thumbnail" className="size-10 rounded-full" />
                            </div>
                        )}
                        <div className="">
                            <h1 className="text-base md:text-lg font-semibold leading-6">{video.title}</h1>
                            <div className="text-gray-500 font-semibold md:text-base text-sm">
                                <p>{video.channelTitle}</p>
                                <p>{view} views · {comment} comments</p>
                            </div>
                        </div>
                    </div>
                </div>
                <img src="/assets/logo.png" alt="" className="w-24 h-auto" />
            </div>
            <div className="w-96 md:w-[540px]">
                <Button variant="secondary" onClick={handleDownload}>
                    <Download />
                </Button>
            </div>
        </div>
    );
};

export default Home;
