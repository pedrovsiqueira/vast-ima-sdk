import { isValidUrl, logToScreen } from "./utils.js";

const AD_CONTAINER_ID = "adContainer";
const VAST_TAG_URL_ID = "vastTagUrl";
const SAMPLE_VAST_URL =
  "https://raw.githubusercontent.com/pedrovsiqueira/vast/main/Inline_Linear_Tag-test.xml";

let adsManager;
let adsLoader;
let adDisplayContainer;
let isAdPlaying;
let isContentFinished;

const videoContent = videojs("contentElement");

function requestAds(vastTagUrl) {
  try {
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = vastTagUrl;

    adsRequest.linearAdSlotWidth = 640;
    adsRequest.linearAdSlotHeight = 400;
    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;

    adsLoader.requestAds(adsRequest);
  } catch (error) {
    if (error.message === "google is not defined") {
      displayAdBlockMessage();
    }
    console.error("Error requesting ads:", error);
    logToScreen(
      "Error requesting ads. Please check the console for more details."
    );
  }
}

export function loadAd() {
  let vastTagUrl = getVastTagUrl();

  try {
    validateVastTagUrl(vastTagUrl);
    requestAdsAndSetUpListener(vastTagUrl);
  } catch (error) {
    displayError(error);
  }
}

function getVastTagUrl() {
  return document.getElementById(VAST_TAG_URL_ID).value;
}

function validateVastTagUrl(url) {
  if (!isValidUrl(url)) {
    throw new Error("Invalid VAST tag URL");
  }
}

function requestAdsAndSetUpListener(vastTagUrl) {
  requestAds(vastTagUrl);
  setUpAdsManagerLoadedListener();
}

function setUpAdsManagerLoadedListener() {
  adsLoader?.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    () => playAds(),
    false
  );
}

function displayError(error) {
  alert(error.message);
}

function displayAdBlockMessage() {
  alert("Please disable your ad blocker to view the ad content.");
}

function playAds() {
  if (isAdPlaying) {
    adsManager.resume();
  } else {
    videoContent.load();
    adDisplayContainer.initialize();

    try {
      adsManager.init(640, 360, google.ima.ViewMode.NORMAL);

      adsManager.start();
    } catch (adError) {
      videoContent.play();
    }
  }
}

function onAdError(adErrorEvent) {
  console.log("Ad error:", adErrorEvent.getError());
  adsManager.destroy();
  logToScreen(`Ad Error: ${adErrorEvent.getError().toString()}`);
}

function onContentPauseRequested() {
  isAdPlaying = true;
  videoContent.pause();
  document.getElementById(AD_CONTAINER_ID).style.display = "block";
}

function onContentResumeRequested() {
  isAdPlaying = false;
  document.getElementById(AD_CONTAINER_ID).style.display = "none";
  if (!isContentFinished) {
    videoContent.play();
  }
}

function createAdDisplayContainer() {
  try {
    adDisplayContainer = new google.ima.AdDisplayContainer(
      document.getElementById(AD_CONTAINER_ID),
      videoContent
    );
  } catch (error) {
    console.error("Error creating AdDisplayContainer:", error);
  }
}

function onAdEvent(adEvent) {
  const ad = adEvent.getAd();

  switch (adEvent.type) {
    case google.ima.AdEvent.Type.LOADED:
      if (!ad.isLinear()) {
        isAdPlaying = true;
        videoContent.play();
      }
      break;

    case google.ima.AdEvent.Type.STARTED:
      break;

    case google.ima.AdEvent.Type.COMPLETE:
      if (ad.isLinear()) {
        isAdPlaying = false;
      }
      break;

    case google.ima.AdEvent.Type.FIRST_QUARTILE:
      // Handle FIRST_QUARTILE event
      break;

    case google.ima.AdEvent.Type.MIDPOINT:
      // Handle MIDPOINT event
      break;

    case google.ima.AdEvent.Type.CLICK:
      // Handle CLICK event
      break;
  }

  logToScreen(`Ad Event: ${adEvent.type}`);
}

function addAdsManagerEventListeners(adsManager, events) {
  events.forEach(({ type, handler }) => {
    adsManager.addEventListener(type, handler);
  });
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  const adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
  adsManager = adsManagerLoadedEvent.getAdsManager(
    videoContent,
    adsRenderingSettings
  );

  const eventHandlers = [
    { type: google.ima.AdErrorEvent.Type.AD_ERROR, handler: onAdError },
    {
      type: google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
      handler: onContentPauseRequested,
    },
    {
      type: google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      handler: onContentResumeRequested,
    },
    { type: google.ima.AdEvent.Type.ALL_ADS_COMPLETED, handler: onAdEvent },
    { type: google.ima.AdEvent.Type.LOADED, handler: onAdEvent },
    { type: google.ima.AdEvent.Type.STARTED, handler: onAdEvent },
    { type: google.ima.AdEvent.Type.FIRST_QUARTILE, handler: onAdEvent },
    { type: google.ima.AdEvent.Type.MIDPOINT, handler: onAdEvent },
    { type: google.ima.AdEvent.Type.THIRD_QUARTILE, handler: onAdEvent },
    { type: google.ima.AdEvent.Type.COMPLETE, handler: onAdEvent },
    { type: google.ima.AdEvent.Type.CLICK, handler: onAdEvent },
  ];

  addAdsManagerEventListeners(adsManager, eventHandlers);
}

export function setUpIMA() {
  try {
    createAdDisplayContainer();
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false
    );
    adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false
    );

    const contentEndedListener = function () {
      if (isAdPlaying) return;
      isContentFinished = true;
      adsLoader.contentComplete();
    };
    videoContent.onended = contentEndedListener;
  } catch (error) {
    console.error("Error setting up IMA:", error);
  }
}

export function addSampleVastTag() {
  document.getElementById(VAST_TAG_URL_ID).value = SAMPLE_VAST_URL;
  return SAMPLE_VAST_URL;
}
