import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, Alert, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import TopBar from '@/components/TopBar';
import { AppColors } from '@/constants/theme';
export default function SettingsScreen() {

const { colors, mode, setMode } = useTheme();
  const [camera,        setCamera       ] = React.useState(true);
  const [location,      setLocation     ] = React.useState(true);
  const [microphone,    setMicrophone   ] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [photos,        setPhotos       ] = React.useState(true);
  const [language,      setLanguage     ] = React.useState('English (US)');

  const handleArchive = () =>
    Alert.alert('Archive Account', 'Your profile will be temporarily hidden from Mingle.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => Alert.alert('Done', 'Your profile is now hidden.') },
    ]);

  const handleLogOut = () =>
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => router.replace('/') },
    ]);

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <TopBar
        title="Settings"
        leftIcon="arrow-left"
        rightIcon={undefined}
        onLeftPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={s.subtitle}>Customize your Mingle experience</Text>

        {/* Device Permissions */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <MaterialIcons name="tune" size={20} color={colors.pink} />
            <Text style={s.sectionTitle}>Device Permissions</Text>
          </View>
          {[
            { icon: 'photo-camera',  label: 'Camera',        value: camera,        toggle: () => setCamera(v => !v) },
            { icon: 'location-on',   label: 'Location',      value: location,      toggle: () => setLocation(v => !v) },
            { icon: 'mic',           label: 'Microphone',    value: microphone,    toggle: () => setMicrophone(v => !v) },
            { icon: 'notifications', label: 'Notifications', value: notifications, toggle: () => setNotifications(v => !v) },
            { icon: 'photo-library', label: 'Photos',        value: photos,        toggle: () => setPhotos(v => !v) },
          ].map(({ icon, label, value, toggle }, i, arr) => (
            <View key={label} style={[s.permissionRow, i === arr.length - 1 && s.noBorder]}>
              <View style={s.permissionLeft}>
                <MaterialIcons name={icon as any} size={20} color={colors.pink} style={{ marginRight: 12 }} />
                <Text style={s.permissionLabel}>{label}</Text>
              </View>
              <Switch
                value={value}
                onValueChange={toggle}
                trackColor={{ false: '#DDD', true: colors.pinkLight }}
                thumbColor={value ? colors.pink : '#FFF'}
                ios_backgroundColor="#DDD"
              />
            </View>
          ))}
        </View>

        {/* Accessibility */}
        <View style={s.card}>
          <MaterialIcons name="accessibility-new" size={22} color={colors.pink} />
          <Text style={[s.sectionTitle, { marginTop: 4, marginLeft: 0 }]}>Accessibility</Text>
          <Text style={s.sectionSubtitle}>Screen readers and motion settings</Text>
          <TouchableOpacity style={s.configureRow} onPress={() => Alert.alert('Accessibility', 'Coming soon.')} activeOpacity={0.7}>
            <Text style={s.configureText}>Configure</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.pink} />
          </TouchableOpacity>
        </View>

        {/* Language */}
        <View style={s.card}>
          <TouchableOpacity
            style={s.dropdownRow}
            onPress={() => Alert.alert('Language', 'Choose', [
              { text: 'English (US)', onPress: () => setLanguage('English (US)') },
              { text: 'Français',     onPress: () => setLanguage('Français') },
              { text: 'Cancel', style: 'cancel' },
            ])}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="translate" size={20} color={colors.pink} style={{ marginRight: 12 }} />
              <View>
                <Text style={s.dropdownLabel}>Language</Text>
                <Text style={s.dropdownValue}>{language}</Text>
              </View>
            </View>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.subText} />
          </TouchableOpacity>
        </View>

        {/* Theme */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <MaterialIcons
              name={mode === 'dark' ? 'nights-stay' : mode === 'auto' ? 'brightness-auto' : 'wb-sunny'}
              size={20} color={colors.pink}
            />
            <Text style={s.sectionTitle}>Theme</Text>
          </View>

          {(['light', 'dark', 'auto'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[s.themeOption, mode === option && s.themeOptionActive]}
              onPress={() => setMode(option)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={option === 'dark' ? 'nights-stay' : option === 'auto' ? 'brightness-auto' : 'wb-sunny'}
                size={18}
                color={mode === option ? colors.pink : colors.subText}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.themeOptionLabel, mode === option && { color: colors.pink }]}>
                  {option === 'light' ? 'Radiant Light' : option === 'dark' ? 'Dark' : 'Auto'}
                </Text>
                <Text style={s.themeOptionSub}>
                  {option === 'light' ? 'Always light' : option === 'dark' ? 'Always dark' : 'Dark after 8 PM, light otherwise'}
                </Text>
              </View>
              {mode === option && <MaterialIcons name="check" size={18} color={colors.pink} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Account Archiving */}
        <View style={[s.card, s.archiveCard]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={s.archiveIconWrap}>
              <MaterialIcons name="inventory-2" size={20} color={colors.pink} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.archiveTitle}>Account{'\n'}Archiving</Text>
              <Text style={s.archiveSubtitle}>Temporarily hide{'\n'}your profile from{'\n'}Mingle</Text>
            </View>
            <TouchableOpacity style={s.archiveBtn} onPress={handleArchive} activeOpacity={0.8}>
              <Text style={s.archiveBtnText}>ARCHIVE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Out */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogOut} activeOpacity={0.85}>
          <MaterialIcons name="logout" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Mingle Version 2.4.0 (Radiant)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// styles are a function so they react to theme changes
const makeStyles = (colors: ReturnType<typeof import('@/context/ThemeContext').useTheme>['colors']) =>
  StyleSheet.create({
    safe:           { flex: 1, backgroundColor: colors.background },
    scrollContent:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    subtitle:       { fontSize: 13, color: colors.subText, marginBottom: 16 },
    card:           { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    sectionHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    sectionTitle:   { fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 8 },
    sectionSubtitle:{ fontSize: 12, color: colors.subText, marginTop: 2, marginBottom: 10 },
    permissionRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
    noBorder:       { borderBottomWidth: 0 },
    permissionLeft: { flexDirection: 'row', alignItems: 'center' },
    permissionLabel:{ fontSize: 14, color: colors.text, fontWeight: '500' },
    configureRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.border },
    configureText:  { fontSize: 14, color: colors.pink, fontWeight: '500' },
    dropdownRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    dropdownLabel:  { fontSize: 14, fontWeight: '600', color: colors.text },
    dropdownValue:  { fontSize: 12, color: colors.subText, marginTop: 1 },
    archiveCard:    { borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.background },
    archiveIconWrap:{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
    archiveTitle:   { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 18 },
    archiveSubtitle:{ fontSize: 11, color: colors.subText, marginTop: 2, lineHeight: 15 },
    archiveBtn:     { backgroundColor: colors.text, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    archiveBtnText: { color: colors.card, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
    logoutBtn:      { backgroundColor: '#E53935', borderRadius: 30, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 8, marginBottom: 16 },
    logoutText:     { color: '#FFF', fontSize: 16, fontWeight: '700' },
    version:        { textAlign: 'center', fontSize: 11, color: '#BBBBBB' },
  themeOption:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  themeOptionActive: { borderBottomColor: colors.pink },
  themeOptionLabel:  { fontSize: 14, fontWeight: '600', color: colors.text },
  themeOptionSub:    { fontSize: 11, color: colors.subText, marginTop: 2 },

  });