import { createReducer } from 'redux-create-reducer';
import immutable from 'immutable';

import * as types from '../actions';


export const currentCall = state => {
    let id = state.getIn(['calls', 'currentId']);
    return state.getIn(['calls', 'allCalls', id]);
};

const initialState = {
    currentId: null,
    currentIsPending: false,
    allCalls: {},
    activeCalls: [],
};

export const REPORT_STEPS = [
    'success_or_failure',
    'success_could_talk',
    'success_call_back',
    'failure_reason',
    'failure_message',
    'caller_log',
    'organizer_log',
    'summary',
];


export default createReducer(initialState, {
    ['@@INIT']: (state, action) => {
        return immutable.fromJS(state);
    },

    [types.START_NEW_CALL + '_PENDING']: (state, action) => {
        return state
            .set('currentIsPending', true);
    },

    [types.START_NEW_CALL + '_FULFILLED']: (state, action) => {
        let call = action.payload.data.data;
        let callId = call.id.toString();

        return state
            .set('currentId', callId)
            .set('currentIsPending', false)
            .setIn(['allCalls', callId], immutable.fromJS(call))
            .update('activeCalls', list => list.push(callId));
    },

    [types.SET_LANE_STEP]: (state, action) => {
        let step = action.payload.step;
        let callId = state.get('currentId');

        // Create an empty report for current call when navigating
        // to the "report" lane step.
        if (step === 'report') {
            return state
                .setIn(['allCalls', callId, 'report'], immutable.fromJS({
                    step: REPORT_STEPS[0],
                    success: false,
                    targetCouldTalk: false,
                    callBackAfter: null,
                    failureReason: null,
                    leftMessage: false,
                    callerLog: '',
                    organizerActionNeeded: false,
                    organizerLog: '',
                }));
        }
        else {
            return state;
        }
    },

    [types.SET_CALL_REPORT_FIELD]: (state, action) => {
        let { field, value } = action.payload;
        let callId = state.get('currentId');
        let nextStep;

        if (field === 'success' && value) {
            nextStep = 'success_could_talk';
        }
        else if (field === 'targetCouldTalk' && value) {
            nextStep = 'caller_log';
        }
        else if (field === 'targetCouldTalk' && !value) {
            nextStep = 'success_call_back';
        }
        else if (field === 'callBackAfter') {
            nextStep = 'caller_log';
        }
        else if (field === 'success') {
            nextStep = 'failure_reason';
        }
        else if (field === 'failureReason' && value === "noPickup") {
            nextStep = 'failure_message';
        }
        else if (field === 'failureReason') {
            nextStep = 'caller_log';
        }
        else if (field === 'leftMessage') {
            nextStep = 'caller_log';
        }
        else if (field === 'organizerActionNeeded' && value) {
            nextStep = 'organizer_log';
        }
        else if (field === 'organizerActionNeeded') {
            nextStep = 'summary';
        }

        return state
            .updateIn(['allCalls', callId, 'report'], report => report
                .set(field, value)
                .set('step', nextStep));
    },

    [types.SET_CALL_REPORT_STEP]: (state, action) => {
        let step = action.payload.step;
        let callId = state.get('currentId');

        return state
            .setIn(['allCalls', callId, 'report', 'step'], step);
    },

    [types.SET_CALLER_LOG_MESSAGE]: (state, action) => {
        let msg = action.payload.message;
        let callId = state.get('currentId');

        return state
            .setIn(['allCalls', callId, 'report', 'callerLog'], msg);
    },

    [types.SET_ORGANIZER_LOG_MESSAGE]: (state, action) => {
        let msg = action.payload.message;
        let callId = state.get('currentId');

        return state
            .setIn(['allCalls', callId, 'report', 'organizerLog'], msg);
    },

    [types.FINISH_CALL_REPORT]: (state, action) => {
        let callId = state.get('currentId');

        return state
            .setIn(['allCalls', callId, 'report', 'step'], 'summary');
    },

    [types.SUBMIT_CALL_REPORT + '_PENDING']: (state, action) => {
        let callId = action.meta.callId.toString();

        return state
            .setIn(['allCalls', callId, 'report', 'isPending'], true);
    },

    [types.SUBMIT_CALL_REPORT + '_ERROR']: (state, action) => {
        let callId = action.meta.callId.toString();
        let error = action.payload.data;

        return state
            .setIn(['allCalls', callId, 'report', 'error'],
                immutable.fromJS(error));
    },

    [types.SUBMIT_CALL_REPORT + '_FULFILLED']: (state, action) => {
        let callId = action.meta.callId.toString();

        return state
            .setIn(['allCalls', callId, 'report', 'isPending'], false)
            .update('activeCalls', list => {
                let key = list.findKey(val => val === callId);
                return list.delete(key);
            });
    },
});
