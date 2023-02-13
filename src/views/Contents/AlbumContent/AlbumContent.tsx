import React from 'react';
import styled from 'styled-components';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import AlbumSlider from '../../Album/Slider';

const StyleContent = styled.div`
    background-color: #f1f5f9;
    font-family: GangwonEduPowerExtraBoldA;
    display: flex;
    margin-top: -16px;
    text-align: center;
`;

const AlbumPage = styled.div`
    margin: 20px auto;
`;

export default function AlbumContent() {
    return (
        <div>
            <Header />
            <span>
                <hr />
            </span>
            <StyleContent>
                <Sidebar />
                <AlbumPage>
                    <AlbumSlider />
                </AlbumPage>
            </StyleContent>
            <span>
                <hr style={{ marginTop: '-1px' }} />
            </span>
            <Footer />
        </div>
    );
}
