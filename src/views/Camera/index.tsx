/* eslint-disable */
import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import styled, { keyframes } from 'styled-components';
import { TbLoader } from 'react-icons/tb';
import Emotion from './Emotion';

import './index.css';
import * as types from '../../types/cam';
import constraints from '../../common/constraints';
import uploadToS3Bucket from '../../services/Cam/uploadToS3Bucket';
import sub1UploadToS3Bucket from '../../services/Cam/sub1UploadToS3Bucket';
import sub2UploadToS3Bucket from '../../services/Cam/sub2UploadToS3Bucket';
import EmotionSetData from './EmotionSetData';
// import loadUsim from '../../services/Cam/loadUsim';

const rotate = keyframes`
    from {
        transform: rotate(0deg);
    }

    to { transform: rotate(360deg);
    }
    `;
const Rotate = styled.div`
    display: inline-block;
    animation: ${rotate} 2s linear infinite;
    padding: 2rem 1rem;
    font-size: 1.2rem;
`;

const OnButton = styled.button`
    color: #8a1441;
    font-size: 1em;
    width: 80px;
    margin: 1em;
    padding: 0.25em 1em;
    border: 2px solid #8a1441;
    border-radius: 3px;
    font-family: IBMPlexSansKR-Regular;
    &:active,
    &:hover,
    &:focus {
        background: var(--button-hover-bg-color, white);
    }
`;

const OffButton = styled.button`
    color: #2679cc;
    font-size: 1em;
    width: 80px;
    margin: 1em;
    padding: 0.25em 1em;
    border: 2px solid #2679cc;
    font-family: IBMPlexSansKR-Regular;
    border-radius: 3px;
    &:active,
    &:hover,
    &:focus {
        background: var(--button-hover-bg-color, white);
    }
`;

let recordFlag = false; // 녹화 여부
let camStartFlag = false; // 캠 시작 여부
let sub1SaveS3Flag = false; // 첫번째 서브 저장 여부
let sub2SaveS3Flag = false; // 두번째 서브 저장 여부
let sub1RecordFlag = false; // 첫번째 서브 녹화 여부
let sub2RecordFlag = false; // 두번째 서브 녹화 여부
let recentRecordTime: number;
let recordInfo: types.RecordInfo;
const expression: types.Expression = { value: 0, label: '', target: '', time: 0 };

// 서버로 넘어가는 유저 아이디
const userId = 'test';

// 비디오 사이즈 설정
function CameraPage(props: any) {
    const wrapRef = useRef<any>(null);
    const videoRef = useRef<any>(null);

    const [camStarted, setCamStarted] = useState(true);
    let [video, setVideo] = useState(0);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [recordStarted, setRecordStarted] = useState(false);

    useEffect(() => {
        console.log('video');
    }, [video]);
    const [data, setData] = useState(EmotionSetData(0));

    useEffect(() => {
        // 비디오
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream) => {
                if (videoRef && videoRef.current) {
                    if (camStarted) {
                        camStartFlag = true;
                        videoRef.current.srcObject = stream;
                        setModelLoaded(true);
                    }
                } else {
                    camStartFlag = false;
                    setModelLoaded(false);
                }
            })
            .catch((err) => console.error(err));
    }, [camStarted]);

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

    // 라벨링 할 인물 이미지 로컬에서 가져오기
    const loadImage = async () => {
        // 업로드 된 이미지 이름을 배열에 담아 라벨링 합니다.
        const labels = [`${userId}`];

        return Promise.all(
            labels.map(async (label) => {
                const images = await faceapi.fetchImage(require(`./imgs/${label}.jpg`));
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
        const canvas = faceapi.createCanvasFromMedia(videoRef.current as HTMLVideoElement);
        if (wrapRef.current !== null) wrapRef.current.append(canvas);

        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); // 다운로드할 영상 변수 생성
        const mediaRecorder = new MediaRecorder(mediaStream); // 새로운 영상 객체 생성
        mediaRecorder.ondataavailable = handleDataAvailable;

        // 첫번째 서브 녹화
        const sub1MediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const sub1MediaRecorder = new MediaRecorder(sub1MediaStream);
        sub1MediaRecorder.ondataavailable = sub1HandleDataAvailable;

        // 두번째 서브 녹화
        const sub2MediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const sub2MediaRecorder = new MediaRecorder(sub2MediaStream);
        sub2MediaRecorder.ondataavailable = sub2HandleDataAvailable;

        subRecordLoop(sub1MediaRecorder, sub2MediaRecorder);

        let displaySize = { width: constraints.video.width, height: constraints.video.height };

        if (videoRef.current) {
            // 영상 사이즈를 canvas에 맞추기 위한 설정
            displaySize = {
                width: videoRef.current.width,
                height: videoRef.current.height,
            };
        }

        faceapi.matchDimensions(canvas, displaySize); // canvas 사이즈를 맞춤

        // 로컬 대조 이미지 가져오기
        const labeledFaceDescriptors = await loadImage();

        // 안면 인식 부분
        const faceDetecting = async (expression: types.Expression) => {
            let detections;

            if (videoRef.current) {
                detections = await faceapi
                    .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
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
                    const label = faceMatcher.findBestMatch(matched.descriptor).label; // Face Detection
                    // const labelColor = label === userId ? 'red' : 'blue';
                    const drawBox = new faceapi.draw.DrawBox(box, { boxColor: 'red', label: label });

                    // if (label === userId) drawBox.draw(canvas); // 특정 사용자가 감지됐을 때만 바운딩 박스 표시
                    drawBox.draw(canvas); // 특정 사용자가 감지됐을 때만 바운딩 박스 표시

                    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections); // 감정 수치 표시

                    const { neutral, ...otherDetection }: Record<string, any> = detection.expressions;

                    expression.value = Math.max(...Object.values(otherDetection));
                    expression.label = Object.keys(otherDetection).find((key) => otherDetection[key] === expression.value) || ''; // 현재 최대 수치 감정 종류 가져오기
                    expression.target = label;
                    expression.time = Date.now();

                    if (expression.target === userId) {
                        setData(EmotionSetData(detection.expressions));
                    }
                });
            return expression;
        };

        const loop = async () => {
            const expressions = await faceDetecting(expression);
            // 새로 녹화 시작
            // if (!recordFlag && expressions.value > constraints.model.emotionValue && expressions.label === 'happy' && expressions.target === userId) {
            if (expressions.value > constraints.model.emotionValue && expressions.label === 'happy') {
                recordInfo = {
                    userId: userId,
                    maxValue: expressions.value,
                    label: expressions.label,
                    count: 1,
                    startTime: expressions.time,
                    maxTime: -32400000,
                };
                recordFlag = true;
                recentRecordTime = expressions.time; // 최근 감정 갱신 시간
                mediaRecorder.start();
                recordVideo(mediaRecorder, sub1MediaRecorder, sub2MediaRecorder); // 녹화시작
                setRecordStarted(true);
                console.log('녹화 시작');

                if (sub1RecordFlag && !sub2RecordFlag) {
                    sub1SaveS3Flag = true;
                } else if (!sub1RecordFlag && sub2RecordFlag) {
                    sub2SaveS3Flag = true;
                }
            }
            // 녹화 시간 연장
            else if (
                recordFlag &&
                expressions.value > constraints.model.emotionValue &&
                expressions.label === recordInfo.label &&
                expressions.target === userId
            ) {
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

    const subRecordLoop = async (sub1MediaRecorder: MediaRecorder, sub2MediaRecorder: MediaRecorder) => {
        sub1RecordVideo(sub1MediaRecorder);
        setTimeout(async () => {
            sub2RecordVideo(sub2MediaRecorder);
        }, 5000);

        setTimeout(async () => {
            if (camStartFlag && !recordFlag) subRecordLoop(sub1MediaRecorder, sub2MediaRecorder);
        }, 5000);
    };

    const recordVideo = async (mediaRecorder: MediaRecorder, sub1MediaRecorder: MediaRecorder, sub2MediaRecorder: MediaRecorder) => {
        setTimeout(async () => {
            if (recordInfo.count <= 5 && Date.now() - recentRecordTime < 2000) {
                // 2초 이내 감정 갱신시, 시간 추가
                console.log('녹화 연장');
                recordInfo.count++; // 시간 연장 횟수 (최대 1분까지만 저장되게 구현)
                recordVideo(mediaRecorder, sub1MediaRecorder, sub2MediaRecorder);
            } else {
                try {
                    if (videoRef.current) {
                        mediaRecorder.stop();
                        props.onVideoListRender(new Date());
                    }
                    recordFlag = false;
                    recentRecordTime = 0;
                    console.log('녹화 중지');
                    setRecordStarted(false);
                    subRecordLoop(sub1MediaRecorder, sub2MediaRecorder);
                } catch (err) {
                    console.log(err);
                }
            }
        }, 10000);
    };

    const sub1RecordVideo = async (sub1MediaRecorder: MediaRecorder) => {
        if (camStartFlag && sub1RecordFlag === false && !recordFlag) {
            sub1MediaRecorder.start();
            console.log('서브1 녹화 시작');
            sub1RecordFlag = true;
        } else {
            sub1MediaRecorder.stop();
            console.log('서브1 녹화 중지');
            sub1RecordFlag = false;
        }
    };
    const sub2RecordVideo = async (sub2MediaRecorder: MediaRecorder) => {
        if (camStartFlag && sub2RecordFlag === false && !recordFlag) {
            sub2MediaRecorder.start();
            console.log('서브2 녹화 시작');
            sub2RecordFlag = true;
        } else {
            sub2MediaRecorder.stop();
            console.log('서브2 녹화 중지');
            sub2RecordFlag = false;
        }
    };

    async function handleDataAvailable(event: any) {
        const recordedChunks: any[] = [];
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
            if (camStarted === true) await uploadToS3Bucket(recordInfo, recordedChunks);
            recordedChunks.pop();
        }
    }

    async function sub1HandleDataAvailable(event: any) {
        const sub1RecordedChunks: any[] = [];

        if (event.data.size > 0) {
            sub1RecordedChunks.push(event.data);
        }

        console.log('sub1 1111111', sub1RecordedChunks);
        if (camStarted && !sub1SaveS3Flag) {
            sub1RecordedChunks.pop();
        } else if (camStarted && sub1SaveS3Flag) {
            console.log('sub1 ininininin', sub1RecordedChunks);
            sub1SaveS3Flag = false;
            await sub1UploadToS3Bucket(sub1RecordedChunks);
            sub1RecordedChunks.pop();
        }
        console.log('sub1 22222222', sub1RecordedChunks);
    }

    async function sub2HandleDataAvailable(event: any) {
        const sub2RecordedChunks: any[] = [];

        if (event.data.size > 0) {
            sub2RecordedChunks.push(event.data);
        }

        console.log('sub2 1111111', sub2RecordedChunks);
        if (camStarted && !sub2SaveS3Flag) {
            sub2RecordedChunks.pop();
        } else if (camStarted && sub2SaveS3Flag) {
            console.log('sub2 ininininin', sub2RecordedChunks);
            sub2SaveS3Flag = false;
            await sub2UploadToS3Bucket(sub2RecordedChunks);
            sub2RecordedChunks.pop();
        }
        console.log('sub2 2222222', sub2RecordedChunks);
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
            <div>
                {recordStarted ? <button style={onairButton}>ON AIR</button> : <button style={offairButton}>ON AIR</button>}
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
                        {camStarted ? (
                            <video ref={videoRef} autoPlay muted onPlay={onPlay} width={constraints.video.width} height={constraints.video.height} />
                        ) : (
                            <Rotate>
                                <TbLoader size="50" style={{ padding: 0 }} />
                            </Rotate>
                        )}
                    </div>
                </div>
                <div>
                    <OnButton onClick={() => setCamStarted(true)}>ON</OnButton>
                    <OffButton onClick={() => setCamStarted(false)}>OFF</OffButton>
                </div>
            </div>
            <Emotion data={data} />
        </>
    );
}

export default CameraPage;
