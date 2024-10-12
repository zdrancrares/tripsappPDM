import React, { useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { TripProps } from './TripProps';
import {createTrip, getTrips, newWebSocket, updateTrip} from './tripApi';

const log = getLogger('ItemProvider');

type SaveTripFn = (item: TripProps) => Promise<any>;

export interface TripsState {
  trips?: TripProps[],
  fetching: boolean,
  fetchingError?: Error | null,
  saving: boolean,
  savingError?: Error | null,
  saveTrip?: SaveTripFn,
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: TripsState = {
  fetching: false,
  saving: false,
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';

const reducer: (state: TripsState, action: ActionProps) => TripsState =
  (state, { type, payload }) => {
    switch(type) {
      case FETCH_ITEMS_STARTED:
        return { ...state, fetching: true, fetchingError: null };
      case FETCH_ITEMS_SUCCEEDED:
        return { ...state, items: payload.items, fetching: false };
      case FETCH_ITEMS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      case SAVE_ITEM_STARTED:
        return { ...state, savingError: null, saving: true };
      case SAVE_ITEM_SUCCEEDED:
        const items = [...(state.trips || [])];
        const item = payload.item;
        const index = items.findIndex(it => it.id === item.id);
        if (index === -1) {
          items.splice(0, 0, item);
        } else {
          items[index] = item;
        }
        return { ...state,  items, saving: false };
      case SAVE_ITEM_FAILED:
        return { ...state, savingError: payload.error, saving: false };
      default:
        return state;
    }
  };

export const TripContext = React.createContext<TripsState>(initialState);

interface TripProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const TripProvider: React.FC<TripProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { trips, fetching, fetchingError, saving, savingError } = state;
  useEffect(getTripsEffect, []);
  useEffect(wsEffect, []);
  const saveItem = useCallback<SaveTripFn>(saveTripCallback, []);
  const value = { trips, fetching, fetchingError, saving, savingError, saveItem };
  log('returns');
  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );

  function getTripsEffect() {
    let canceled = false;
    fetchTrips();
    return () => {
      canceled = true;
    }

    async function fetchTrips() {
      try {
        log('fetchTrips started');
        dispatch({ type: FETCH_ITEMS_STARTED });
        const trips = await getTrips();
        log('fetchTrips succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { trips } });
        }
      } catch (error) {
        log('v failed');
        if (!canceled) {
          dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
        }
      }
    }
  }

  async function saveTripCallback(trip: TripProps) {
    try {
      log('saveTrip started');
      dispatch({ type: SAVE_ITEM_STARTED });
      const savedTrip = await (trip.id ? updateTrip(trip) : createTrip(trip));
      log('saveTrip succeeded');
      dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedTrip } });
    } catch (error) {
      log('saveTrip failed');
      dispatch({ type: SAVE_ITEM_FAILED, payload: { error } });
    }
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    const closeWebSocket = newWebSocket(message => {
      if (canceled) {
        return;
      }
      const { event, payload: { item }} = message;
      log(`ws message, item ${event}`);
      if (event === 'created' || event === 'updated') {
        dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
      }
    });
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket();
    }
  }
};
