import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { escapeString, getQrCodeText, useWifiQRCode } from './useQRCode';

describe('wifi-qr-code-generator useQRCode', () => {
  describe('escapeString', () => {
    it('escapes special ZXing WiFi QR delimiter characters', () => {
      expect(escapeString('my\\net;work,name:"test"')).toBe('my\\\\net\\;work\\,name\\:\\"test\\"');
    });
  });

  describe('getQrCodeText', () => {
    it('returns null when SSID is empty or missing', () => {
      expect(getQrCodeText({
        ssid: '',
        password: 'secret',
        encryption: 'WPA',
        isHiddenSSID: false,
        eapAnonymous: false,
      })).toBeNull();
    });

    it('generates nopass and WPA payloads with escaped values and hidden flag', () => {
      expect(getQrCodeText({
        ssid: 'Cafe;Guest',
        password: '',
        encryption: 'nopass',
        isHiddenSSID: false,
        eapAnonymous: false,
      })).toBe('WIFI:S:Cafe\\;Guest;;');

      expect(getQrCodeText({
        ssid: 'Home:Net',
        password: 'pass,word',
        encryption: 'WPA',
        isHiddenSSID: true,
        eapAnonymous: false,
      })).toBe('WIFI:S:Home\\:Net;T:WPA;P:pass\\,word;H:true;');
    });

    it('omits PH2 when eapPhase2Method is undefined or None for WPA2-EAP', () => {
      expect(getQrCodeText({
        ssid: 'CorpNet',
        password: 'secret',
        encryption: 'WPA2-EAP',
        eapMethod: 'TLS',
        isHiddenSSID: false,
        eapAnonymous: false,
        eapIdentity: 'user@corp',
        eapPhase2Method: undefined,
      })).toBe('WIFI:S:CorpNet;T:WPA2-EAP;P:secret;E:TLS;I:user@corp;;');

      expect(getQrCodeText({
        ssid: 'CorpNet',
        password: 'secret',
        encryption: 'WPA2-EAP',
        eapMethod: 'PEAP',
        isHiddenSSID: false,
        eapAnonymous: true,
        eapPhase2Method: 'None',
      })).toBe('WIFI:S:CorpNet;T:WPA2-EAP;P:secret;E:PEAP;A:anon;;');

      expect(getQrCodeText({
        ssid: 'CorpNet',
        password: 'secret',
        encryption: 'WPA2-EAP',
        eapMethod: 'PEAP',
        isHiddenSSID: false,
        eapAnonymous: false,
        eapIdentity: 'alice',
        eapPhase2Method: 'MSCHAPV2',
      })).toBe('WIFI:S:CorpNet;T:WPA2-EAP;P:secret;E:PEAP;PH2:MSCHAPV2;I:alice;;');
    });

    it('requires phase 2 method when EAP method is PEAP', () => {
      expect(getQrCodeText({
        ssid: 'CorpNet',
        password: 'secret',
        encryption: 'WPA2-EAP',
        eapMethod: 'PEAP',
        isHiddenSSID: false,
        eapAnonymous: true,
        eapPhase2Method: undefined,
      })).toBeNull();
    });
  });

  describe('useWifiQRCode', () => {
    it('clears stale qrcode when inputs become invalid', async () => {
      const ssid = ref('MyWifi');
      const password = ref('secret123');
      const eapMethod = ref();
      const isHiddenSSID = ref(false);
      const eapAnonymous = ref(false);
      const eapIdentity = ref('');
      const eapPhase2Method = ref();
      const foreground = ref('#000000ff');
      const background = ref('#ffffffff');

      const { qrcode } = useWifiQRCode({
        ssid,
        password,
        eapMethod,
        isHiddenSSID,
        eapAnonymous,
        eapIdentity,
        eapPhase2Method,
        color: { foreground, background },
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(qrcode.value).toMatch(/^data:image\/png;base64,/);

      ssid.value = '';
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(qrcode.value).toBe('');
    });
  });
});
