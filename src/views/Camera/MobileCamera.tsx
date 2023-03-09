import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as faceapi from 'face-api.js';
import * as io from 'socket.io-client';
import styled, { keyframes } from 'styled-components';
import { TbLoader } from 'react-icons/tb';

import './index.css';
import Emotion from './Emotion';
import * as types from '../../types/cam';
import constraints from '../../common/constraints';
import uploadToS3Bucket from '../../services/Cam/uploadToS3Bucket';
import EmotionSetData from './EmotionSetData';
import config from '../../config';
import axios from 'axios';
import { ConnectingAirportsOutlined } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import iphone from '../../assets/iphone-frame.png';
import { margin } from '@mui/system';

let recordFlag = false; // 녹화 여부
let recentRecordTime: number;
let recordInfo: types.RecordInfo;
const expression: types.Expression = { value: 0, label: '', target: '', time: 0 };

// 서버로 넘어가는 유저 아이디
const socket = io.connect(`${config.server.protocol}://${config.server.host}:4001`);
let myStream: any;
let myPeerConnection: any;

// 비디오 사이즈 설정
function MobileCamera(props: any) {
    const { usim } = useSelector((state: any) => state.usim);
    const { userId, nickname } = useSelector((state: any) => state.auth);
    const wrapRef = useRef<any>(null);
    const videoRef = useRef<any>(null);
    const mobileRef = useRef<any>(null);
    const [onRemoteStream, setOnRemoteStream] = useState(false);

    const [camStarted, setCamStarted] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [recordStarted, setRecordStarted] = useState(false);

    const [data, setData] = useState(EmotionSetData(0));

    // 녹화시간
    const [runningTime, setRunningTime] = useState(0);
    const [timer, setTimerId] = useState<any>(null);

    useEffect(() => {
        setCamStarted(true);
        setModelLoaded(true);
        setOnRemoteStream(true);
    }, [mobileRef]);

    useEffect(() => {
        // 모델 로드
        const MODEL_URL = '/models';

        if (modelLoaded) {
            Promise.all([
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                // 사용자 이미지 Face Detection
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
            ])
                .then(() => {
                    console.log('모델 로드 완료');
                })
                .catch((err) => console.error(err));
        }
    }, [modelLoaded]);

    // socket START
    useEffect(() => {
        handleWelcomeSubmit();
    }, []);

    async function initCall() {
        await getMedia();
        makeConnection();
    }

    async function handleWelcomeSubmit() {
        await initCall();
        socket.emit('join_room', userId);
    }

    async function getCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter((devices) => devices.kind === 'videoinput');
            const currentCamera = myStream.getVideoTracks()[0];
            // console.log(devices);
            // console.log(cameras);
            // console.log(myStream.getVideoTracks()); // 현재 선택된 비디오를 알 수 있음(id는 알 수 없고 label값으로 유추가능)
            cameras.forEach((camera) => {
                const option = document.createElement('option');
                option.value = camera.deviceId; // camera id 가져옴
                option.innerText = camera.label; // camera 이름 가져옴
                if (currentCamera.label == camera.label) {
                    // 가져온 camera label 과 현재 사용중인 카메라가 동일할 떄 선택된 카메라라고 알려줌
                    option.selected = true;
                }
                // camerasSelect.appendChild(option);
            });
        } catch (error) {
            console.log(error);
        }
    }

    async function getMedia(deviceId?: any) {
        const initialConstraints = {
            // 초기 deviceId 를 넘겨주지 않을 경우
            audio: true,
            video: { facingMode: 'user' },
        };
        const cameraConstraints = {
            audio: true,
            video: { deviceId: { exact: deviceId } }, // 굳이 exact 옵션을 안써도 되긴 하는데, deviceId를 받았으므로 exact 옵션을 함께 써준다.
        };
        try {
            myStream = await navigator.mediaDevices.getUserMedia(
                deviceId ? cameraConstraints : initialConstraints, // deviceId 를 받은 경우 실행하는 func, 안받은 경우 실행하는 func를 다르게 둠
            );
            if (videoRef && videoRef.current) videoRef.current.srcObject = myStream;
            if (!deviceId) {
                await getCameras(); // select에 카메라 리스트 띄움 -> 맨처음에 카메라 정보가 없을 때 최초 한번만 실헹
            }
        } catch (e) {
            console.log(e);
        }
    }
    socket.on('offer', async (offer) => {
        // console.log(offer);
        console.log('received the offer');
        myPeerConnection.setRemoteDescription(offer);
        const answer = await myPeerConnection.createAnswer();
        // console.log(answer); // PeerB의 answer 정보 전송
        myPeerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, userId);
        console.log('sent the answer');
    });

    // RTC Code
    function makeConnection() {
        // peerConnection을 각 브라우저에 만들어준다.
        myPeerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: ['stun:ntk-turn-1.xirsys.com'] },
                {
                    username: 'LWvrShK7ZsHj9S1yGqvstsNVMtqt6doYku7Qe3RsMGHKSARd3Wga5gKbNWpnWI7UAAAAAGLEDUdzdWd5ZW9uZw==',
                    credential: '3799e2bc-fc4a-11ec-933b-0242ac120004',
                    urls: [
                        'turn:ntk-turn-1.xirsys.com:80?transport=udp',
                        'turn:ntk-turn-1.xirsys.com:3478?transport=udp',
                        'turn:ntk-turn-1.xirsys.com:80?transport=tcp',
                        'turn:ntk-turn-1.xirsys.com:3478?transport=tcp',
                        'turns:ntk-turn-1.xirsys.com:443?transport=tcp',
                        'turns:ntk-turn-1.xirsys.com:5349?transport=tcp',
                    ],
                },
            ],
        });

        // console.log(myStream.getTracks()); // 내 브라우저에 연결된 audio, video track 정보
        myPeerConnection.addEventListener('icecandidate', handleIce);
        myPeerConnection.addEventListener('addstream', handleAddStream);
        myStream // 양쪽 브라우저의 카메라, 마이크 데이터 stream 을 받아와서 그걸 연결 안에 집어넣어줌
            .getTracks()
            .forEach((track: any) => myPeerConnection.addTrack(track, myStream));
    }

    function handleIce(data: any) {
        socket.emit('ice', data.candidate, userId);
        console.log('sent candidate');
        // console.log(data);
    }

    // CHECK 새로운 사용자 웹 요소로 추가
    function handleAddStream(data: any) {
        // const peersStream: any = document.getElementById('peersStream');
        // console.log("got an stream from my peer");
        console.log("Peer's Stream", data.stream);
        console.log('My Stream', myStream);
        if (mobileRef && mobileRef.current) mobileRef.current.srcObject = data.stream;
    }

    // CHECK 미디어 수신 (peer A 의 방)
    // Socket Code
    // PeerA : createOffer(), setLocalDescription()
    socket.on('welcome', async () => {
        // PeerA 브라우저에서만 발생
        // 누군가가 방에 들어왔을 때 실행
        const offer = await myPeerConnection.createOffer();
        myPeerConnection.setLocalDescription(offer);
        // console.log(offer);
        // console.log("someone joined!");
        console.log('sent the offer');
        socket.emit('offer', offer, userId); // 접속한 socket.io 방으로 PeerA의 session정보를 보냄
    });

    // CHECK 미디어 송신 (peer B 의 방)
    // PeerB : PeerA -> server 로 부터 offer 정보를 받음
    socket.on('offer', async (offer) => {
        // console.log(offer);
        console.log('received the offer');
        myPeerConnection.setRemoteDescription(offer);
        const answer = await myPeerConnection.createAnswer();
        // console.log(answer); // PeerB의 answer 정보 전송
        myPeerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, userId);
        console.log('sent the answer');
    });

    // PeerA : answer로 부터 PeerB의 정보가 넘어오면 setRemoteDescription을 해줌
    socket.on('answer', (answer) => {
        console.log('received the answer');
        myPeerConnection.setRemoteDescription(answer);
    });

    // iceCandidate 받은 걸 저장함
    socket.on('ice', (ice) => {
        console.log('received candidate');
        myPeerConnection.addIceCandidate(ice);
    });

    // socket END

    // 라벨링 할 인물 이미지 로컬에서 가져오기
    const loadImage = async () => {
        return Promise.all(
            usim.map(async (label: string) => {
                const images = await faceapi.fetchImage(label);
                const descriptions = [];
                const detections = await faceapi.detectSingleFace(images).withFaceLandmarks().withFaceDescriptor();
                if (detections) descriptions.push(detections.descriptor);

                return new faceapi.LabeledFaceDescriptors(label, descriptions);
            }),
        );
    };

    // 감정 인식 & 영상 다운로드
    const onPlay = async () => {
        // 이미지 정보를 기반으로 canvas 요소 생성
        const canvas = faceapi.createCanvasFromMedia(mobileRef.current as HTMLVideoElement);
        if (wrapRef.current !== null) wrapRef.current.append(canvas);

        const mediaStream = await mobileRef.current.srcObject({ video: true, audio: true }); // 다운로드할 영상 변수 생성
        const mediaRecorder = new MediaRecorder(mediaStream); // 새로운 영상 객체 생성
        mediaRecorder.ondataavailable = handleDataAvailable;

        let displaySize = { width: constraints.video.width, height: constraints.video.height };

        if (mobileRef.current) {
            // 영상 사이즈를 canvas에 맞추기 위한 설정
            displaySize = {
                width: mobileRef.current.width,
                height: mobileRef.current.height,
            };
        }

        faceapi.matchDimensions(canvas, displaySize); // canvas 사이즈를 맞춤

        // 로컬 대조 이미지 가져오기
        const labeledFaceDescriptors = await loadImage();

        // 안면 인식 부분
        const faceDetecting = async (expression: types.Expression) => {
            let detections;

            if (mobileRef.current) {
                detections = await faceapi
                    .detectAllFaces(mobileRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceExpressions()
                    .withAgeAndGender()
                    .withFaceDescriptors();
            }

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

            const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, constraints.model.matchValue);

            if (resizedDetections)
                resizedDetections.forEach((detection, i) => {
                    const matched = resizedDetections[i];
                    const box = matched.detection.box;
                    // const target = faceMatcher.findBestMatch(matched.descriptor).toString();
                    let label = faceMatcher.findBestMatch(matched.descriptor).label; // Face Detection
                    const labelColor = label !== 'unknown' ? 'red' : 'blue';
                    label = labelColor === 'red' ? nickname : '';
                    const drawBox = new faceapi.draw.DrawBox(box, { boxColor: labelColor, label: label });

                    // if (label === userId) drawBox.draw(canvas); // 특정 사용자가 감지됐을 때만 바운딩 박스 표시
                    drawBox.draw(canvas); // 전체 사용자 인식

                    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections); // 감정 수치 표시

                    const { neutral, ...otherDetection }: Record<string, any> = detection.expressions;

                    expression.value = Math.max(...Object.values(otherDetection));
                    expression.label = Object.keys(otherDetection).find((key) => otherDetection[key] === expression.value) || ''; // 현재 최대 수치 감정 종류 가져오기
                    expression.target = label;
                    expression.time = Date.now();

                    // if (expression.target === userId) { // CHECK
                    setData(EmotionSetData(detection.expressions));
                    // }
                });
            return expression;
        };

        const loop = async () => {
            const expressions = await faceDetecting(expression);
            // 새로 녹화 시작
            // CHECK
            if (!recordFlag && expressions.value > constraints.model.emotionValue && expressions.label === 'happy') {
                // if (!recordFlag && expressions.value > constraints.model.emotionValue && expressions.label === 'happy' && expressions.target === userId) {
                recordFlag = true;
                recordInfo = {
                    maxValue: expressions.value,
                    label: expressions.label,
                    count: 1,
                    startTime: expressions.time,
                    maxTime: -32400000,
                };
                recentRecordTime = expressions.time; // 최근 감정 갱신 시간
                mediaRecorder.start();
                recordVideo(mediaRecorder); // 녹화시작
                setRecordStarted(true);
                console.log('녹화 시작');

                // 녹화 경과시간 표시
                const timer = setInterval(() => {
                    setRunningTime((prevTime) => prevTime + 1);
                }, 1000);
                setTimerId(timer);
            }
            // 녹화 시간 연장
            else if (recordFlag && expressions.value > constraints.model.emotionValue && expressions.label === recordInfo.label) {
                if (recordInfo.maxValue < expressions.value) {
                    // 최대 감정 관측 데이터 변경
                    recordInfo.maxValue = expressions.value;
                    recordInfo.maxTime = expressions.time - recordInfo.startTime - 32400000;
                }
                recentRecordTime = expressions.time; // 최근 감정 갱신 시간
            }

            if (camStarted === true) setTimeout(loop, 0.03);
        };
        setTimeout(loop, 0.03);
    };

    const recordVideo = async (mediaRecorder: MediaRecorder) => {
        setTimeout(async () => {
            if (recordInfo.count <= 5 && Date.now() - recentRecordTime < 2000) {
                // 2초 이내 감정 갱신시, 시간 추가
                console.log('녹화 연장');
                recordInfo.count++; // 시간 연장 횟수 (최대 1분까지만 저장되게 구현)
                recordVideo(mediaRecorder);
            } else {
                try {
                    if (mobileRef.current) {
                        mediaRecorder.stop();
                        props.onVideoListRender(new Date());
                    }
                    recordFlag = false;
                    recentRecordTime = 0;
                    console.log('녹화 중지');
                    setRecordStarted(false);
                } catch (err) {
                    console.log(err);
                }
            }
        }, 15000);
    };

    async function handleDataAvailable(event: any) {
        const recordedChunks: any[] = [];
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
            if (camStarted === true) await uploadToS3Bucket(recordInfo, recordedChunks);
            recordedChunks.pop();
        }
    }

    const onairButton = {
        backgroundColor: 'black',
        color: 'red',
        textDecoration: 'none',
        marginBottom: 20,
        fontWeight: 'bold',
        border: '4px solid red',
        boxShadow: '4px 4px 4px rgba(0, 0, 0, 0.5), -4px -4px 4px rgba(255, 255, 255, 0.5)',
        padding: '8px 16px',
        fontSize: '24px',
        borderRadius: '20px',
        transition: 'all 0.6s ease-in-out',
    };

    const offairButton = {
        backgroundColor: 'black',
        color: 'white',
        textDecoration: 'none',
        marginBottom: 20,
        fontWeight: 'bold',
        border: '2px solid grey',
        boxShadow: '4px 4px 4px rgba(0, 0, 0, 0.5), -4px -4px 4px rgba(255, 255, 255, 0.5)',
        padding: '8px 16px',
        fontSize: '24px',
        borderRadius: '20px',
        transition: 'all 0.6s ease-in-out',
    };

    return (
        <>
            <div style={{ marginBottom: '100px' }}>
                <Link to={`/remote/${userId}`}>
                    <div style={{ marginLeft: '7px', marginTop: '30px', marginBottom: '10px' }}>
                        {recordStarted ? <button style={onairButton}>ON AIR</button> : <button style={offairButton}>ON AIR</button>}
                    </div>
                </Link>
                {/* <div>녹화시간 : {runningTime}</div> */}
                <div
                    ref={wrapRef}
                    id="wrap"
                    style={{
                        borderStyle: 'none',
                        width: constraints.video.width,
                        height: constraints.video.height,
                    }}
                >
                    <div>
                        <QRCodeSVG value={`${config.server.protocol}://${config.client.host}/remote/${userId}`} />
                        {onRemoteStream ? (
                            <video ref={mobileRef} autoPlay muted onPlay={onPlay} width={constraints.video.width} height={constraints.video.height} />
                        ) : (
                            ''
                            // <video
                            //     src={`https://${config.aws.bucket_name}.s3.${config.aws.region}.amazonaws.com/assets/loading-video.mp4`}
                            //     autoPlay
                            //     loop
                            //     muted
                            //     style={{ objectFit: 'cover' }}
                            //     width={constraints.video.width}
                            //     height={constraints.video.height}
                            // />
                        )}

                    </div>
                </div>
            </div>
            <Emotion data={data} />
        </>
    );
}

export default MobileCamera;
