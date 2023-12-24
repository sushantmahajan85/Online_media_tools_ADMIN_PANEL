import React, { useEffect, useState } from "react";
import style from "./ui.module.css"
import { Link, useParams } from "react-router-dom";
import { db, } from "../../firebase";
import { collection, getDocs, } from "firebase/firestore";
import { selecteUsers } from "../../Store/authSlice";
import { useSelector } from "react-redux";

export function UserChats() {
    const StoreAllUsers = useSelector(selecteUsers)
    const { id } = useParams()
    const [ChatUser, setChatUser] = useState([])

    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                const querySnapshot = await getDocs(collection(db, "chats"));
                let Mychat = []
                querySnapshot.forEach((doc) => {
                    if (doc.id.includes(id)) {
                        Mychat.push({
                            chatId: doc.id,
                        })
                    }
                });

                const chatedUsers = Mychat.map(chat => {
                    const otherUserId = chat.chatId.split('_').find(userid => userid !== id);
                    const otherUser = StoreAllUsers.find(user => user._id === otherUserId);
                    // // console.log(otherUser)
                    const otherUserData = {
                        chatId: chat.chatId,
                        otherUser
                    }
                    return otherUserData;
                }).filter((user) => user.otherUser !== undefined);
                setChatUser(chatedUsers)

            };
            fetchData();
        }
    }, [id, StoreAllUsers]);




    return (<>
        <div className={`p-2  text-light ${style.Sheading} `}>
            <h2 className={style.Heading}>
                User All Chats
            </h2>
        </div>


        <div className="my-2 p-2">

            <div className={style.containerContent}>
                {ChatUser.length > 0 ?
                    <div>


                        <div className={style.HeadingContent}>
                            <div className="row gap-2 text-left">
                                <div className="col">
                                    <h2 className="fw-bold fs-5">User Name</h2>
                                </div>

                                <div className="col">
                                    <h2 className="fw-bold fs-5">Email</h2>
                                </div>

                            </div>
                        </div>
                        {/* to={` */}
                        {ChatUser.map((userobj, index) => {
                            return <div key={index} className={style.Content}>
                                <div style={{ cursor: "pointer", textDecoration: "none", color: "black" }} className={`row text-left `}>
                                    <Link to={`/Admin/AdminDashboard/UserDetails/${id}/UserChats/${userobj.chatId}/Chat`} style={{ textDecoration: "underline", color: "green" }} className="col d-flex align-items-center justify-content-start gap-2">
                                        <div>
                                            {
                                                userobj.otherUser.profileImageUrl &&
                                                <img
                                                    src={userobj.otherUser.profileImageUrl}
                                                    className="rounded-circle"

                                                    alt="avatar"
                                                    width="45"
                                                    height="45"
                                                />
                                            }
                                        </div>
                                        <div>
                                            <h2 className="fw-medium fs-6">{userobj.otherUser.firstName + " " + userobj.otherUser.lastName}</h2>
                                        </div>
                                    </Link>


                                    <div className="col d-flex align-items-center justify-content-start">
                                        <h2 className="fw-medium fs-6">{userobj.otherUser.email}</h2>
                                    </div>


                                </div>
                            </div>
                        })}
                    </div>
                    :
                    <div><p className="text-center fw-bold">
                        No Chats Found
                    </p></div>
                }



            </div>
        </div>


    </>)
}
