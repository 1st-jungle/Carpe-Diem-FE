import {
    CARD_LIST_LOADING_REQUEST,
    CARD_LIST_LOADING_SUCCESS,
    CARD_LIST_LOADING_FAILURE,
    CARD_LOADING_REQUEST,
    CARD_LOADING_SUCCESS,
    CARD_LOADING_FAILURE,
    CARD_UPDATE_REQUEST,
    CARD_UPDATE_SUCCESS,
    CARD_UPDATE_FAILURE,
    CARD_DELETE_REQUEST,
    CARD_DELETE_SUCCESS,
    CARD_DELETE_FAILURE,
    CARD_LIST_FILTER_DATE,
    CARD_LIST_FILTER_EXPRESSION,
    CARD_LIST_FILTER_EXPRESSION_SUCCESS,
} from '../types';

const initialState = {
    cardList: [],
    card: [],
};
const expressions = ['happy', 'sad', 'angry', 'disgusted', 'fearful', 'surprised'];

const cardListReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case CARD_LIST_LOADING_REQUEST:
        case CARD_LIST_LOADING_SUCCESS:
        case CARD_LIST_FILTER_EXPRESSION_SUCCESS:
            return {
                ...state,
                cardList: action.payload,
            };
        case CARD_LIST_FILTER_EXPRESSION:
            console.log('cardReducer', action.payload);
            console.log('state.cardList');
            console.log(state.cardList.filter((card: any) => action.payload[expressions.indexOf(card.expressionLabel, 0)] === true));
            return {
                ...state,
                cardList: state.cardList.filter((card: any) => action.payload[expressions.indexOf(card.expressionLabel, 0)] === true),
            };
        default:
            return {
                ...state,
            };
    }
};

const cardReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case CARD_LOADING_REQUEST:
        case CARD_LOADING_SUCCESS:
            return {
                ...state,
                card: action.payload,
            };
        case CARD_UPDATE_SUCCESS:
        case CARD_DELETE_SUCCESS:
            return {
                ...state,
                card: action.payload,
            };
        default:
            return {
                ...state,
            };
    }
};

export { cardListReducer, cardReducer };
