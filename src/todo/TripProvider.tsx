import React, { useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { TripProps } from './TripProps';
import {createTrip, getTrips, newWebSocket, updateTrip} from './tripApi';

const log = getLogger('TripProvider');

type SaveTripFn = (trip: TripProps) => Promise<any>;

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

const FETCH_TRIPS_STARTED = 'FETCH_TRIPS_STARTED';
const FETCH_TRIPS_SUCCEEDED = 'FETCH_TRIPS_SUCCEEDED';
const FETCH_TRIPS_FAILED = 'FETCH_TRIPS_FAILED';
const SAVE_TRIP_STARTED = 'SAVE_TRIP_STARTED';
const SAVE_TRIP_SUCCEEDED = 'SAVE_TRIP_SUCCEEDED';
const SAVE_TRIP_FAILED = 'SAVE_TRIP_FAILED';

const reducer: (state: TripsState, action: ActionProps) => TripsState =
  (state, { type, payload }) => {
    switch(type) {
      case FETCH_TRIPS_STARTED:
        return { ...state, fetching: true, fetchingError: null };
      case FETCH_TRIPS_SUCCEEDED:
        return { ...state, trips: payload.trips, fetching: false };
      case FETCH_TRIPS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      case SAVE_TRIP_STARTED:
        return { ...state, savingError: null, saving: true };
      case SAVE_TRIP_SUCCEEDED:
        const trips = [...(state.trips || [])];
        const trip = payload.trip;
        const index = trips.findIndex(t => t.id === trip.id);
        if (index === -1) {
          trips.splice(0, 0, trip);
        } else {
          trips[index] = trip;
        }
        return { ...state,  trips, saving: false };
      case SAVE_TRIP_FAILED:
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
  const saveTrip = useCallback<SaveTripFn>(saveTripCallback, []);
  const value = { trips, fetching, fetchingError, saving, savingError, saveTrip };
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
        dispatch({ type: FETCH_TRIPS_STARTED });
        const trips = await getTrips();
        log('fetchTrips succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_TRIPS_SUCCEEDED, payload: { trips } });
        }
      } catch (error) {
        log('v failed');
        if (!canceled) {
          dispatch({ type: FETCH_TRIPS_FAILED, payload: { error } });
        }
      }
    }
  }

  async function saveTripCallback(trip: TripProps) {
    try {
      log('saveTrip started');
      dispatch({ type: SAVE_TRIP_STARTED });
      const savedTrip = await (trip.id ? updateTrip(trip) : createTrip(trip));
      log('saveTrip succeeded');
      dispatch({ type: SAVE_TRIP_SUCCEEDED, payload: { trip: savedTrip } });
    } catch (error) {
      log('saveTrip failed');
      dispatch({ type: SAVE_TRIP_FAILED, payload: { error } });
    }
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    const closeWebSocket = newWebSocket(message => {
      if (canceled) {
        return;
      }
      const { event, payload: { trip }} = message;
      log(`ws message, trip ${event}`);
      if (event === 'created' || event === 'updated') {
        dispatch({ type: SAVE_TRIP_SUCCEEDED, payload: { trip } });
      }
    });
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket();
    }
  }
};
