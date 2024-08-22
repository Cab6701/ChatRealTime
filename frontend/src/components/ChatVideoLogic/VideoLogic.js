// API call to create meeting
export const createMeeting = async (token) => {
    console.log("===> " + token.token);
    try {
        const options = {
            method: "POST",
            headers: {
                "Authorization": token.token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        };
        const url = `https://api.videosdk.live/v2/rooms`;
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data);

        const { roomId } = data;
        return roomId;
    } catch (error) {
        console.error("Error creating meeting:", error.message);
        throw error;
    }
};