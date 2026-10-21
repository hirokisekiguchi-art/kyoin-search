/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  TeacherCandidate, 
  School, 
  SearchFilterState, 
  OfficialSource, 
  RecentGazetteUpdate,
  PersonnelObservation,
  AuditLogItem 
} from './types';
import { 
  INITIAL_TEACHERS, 
  INITIAL_SCHOOLS, 
  RECENT_UPDATES_DATA, 
  INITIAL_OBSERVATIONS, 
  INITIAL_AUDIT_LOGS,
  OFFICIAL_SOURCES_DATA 
} from './data/archiveData';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { SearchResults } from './components/SearchResults';
import { TeacherDetailModal } from './components/TeacherDetailModal';
import { SchoolDetailModal } from './components/SchoolDetailModal';
import { SourceDetailsModal } from './components/SourceDetailsModal';
import { PrefectureExplorer } from './components/PrefectureExplorer';
import { RecentUpdates } from './components/RecentUpdates';
import { ReviewSystemModal } from './components/ReviewSystemModal';
import { AboutArchiveModal } from './components/AboutArchiveModal';
import { Footer } from './components/Footer';

export default function App() {
  // Archive Data States
  const [teachers, setTeachers] = useState<TeacherCandidate[]>(INITIAL_TEACHERS);
  const [schools, setSchools] = useState<School[]>(INITIAL_SCHOOLS);
  const [observations, setObservations] = useState<PersonnelObservation[]>(INITIAL_OBSERVATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [updates] = useState<RecentGazetteUpdate[]>(RECENT_UPDATES_DATA);

  // Search Filter State
  const [filters, setFilters] = useState<SearchFilterState>({
    query: '',
    searchType: 'all',
    prefecture: '',
    municipality: '',
    schoolType: '',
    fiscalYear: '',
    eventType: '',
  });

  // Modal Dialog States
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherCandidate | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedSource, setSelectedSource] = useState<OfficialSource | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  // Refs for scrolling to sections
  const resultsRef = useRef<HTMLDivElement>(null);
  const prefectureRef = useRef<HTMLDivElement>(null);
  const updatesRef = useRef<HTMLDivElement>(null);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      // Query search
      if (filters.query.trim()) {
        const q = filters.query.trim().toLowerCase();
        const matchesName = teacher.name.toLowerCase().includes(q);
        const matchesKana = teacher.kana ? teacher.kana.toLowerCase().includes(q) : false;
        const matchesSchool = teacher.currentSchoolName.toLowerCase().includes(q);
        const matchesPosition = teacher.currentPosition.toLowerCase().includes(q);
        const matchesTimeline = teacher.timeline.some(
          (t) =>
            t.schoolName.toLowerCase().includes(q) ||
            (t.previousSchoolName && t.previousSchoolName.toLowerCase().includes(q)) ||
            (t.note && t.note.toLowerCase().includes(q))
        );
        const matchesLocation =
          teacher.prefecture.toLowerCase().includes(q) ||
          teacher.municipality.toLowerCase().includes(q);

        if (!matchesName && !matchesKana && !matchesSchool && !matchesPosition && !matchesTimeline && !matchesLocation) {
          return false;
        }
      }

      // Prefecture filter
      if (filters.prefecture && teacher.prefecture !== filters.prefecture) {
        return false;
      }

      // Municipality filter
      if (
        filters.municipality &&
        !teacher.municipality.toLowerCase().includes(filters.municipality.trim().toLowerCase())
      ) {
        return false;
      }

      // School type filter
      if (filters.schoolType && teacher.schoolType !== filters.schoolType) {
        return false;
      }

      // Fiscal year filter
      if (filters.fiscalYear) {
        const targetYear = parseInt(filters.fiscalYear, 10);
        const hasYearInTimeline = teacher.timeline.some((t) => t.fiscalYear === targetYear);
        if (teacher.latestFiscalYear !== targetYear && !hasYearInTimeline) {
          return false;
        }
      }

      // Event type filter
      if (filters.eventType) {
        const hasEventType = teacher.timeline.some((t) => t.eventType === filters.eventType);
        if (!hasEventType) {
          return false;
        }
      }

      return true;
    });
  }, [teachers, filters]);

  // Filtered schools
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      // Query search
      if (filters.query.trim()) {
        const q = filters.query.trim().toLowerCase();
        const matchesName = school.name.toLowerCase().includes(q);
        const matchesFormer = school.formerNames?.some((fn) => fn.toLowerCase().includes(q));
        const matchesLocation =
          school.prefecture.toLowerCase().includes(q) ||
          school.municipality.toLowerCase().includes(q);
        const matchesFounder = school.founder.toLowerCase().includes(q);
        const matchesPersonnel = school.personnelByYear.some((py) => {
          const matchPrincipal = py.principal?.name.toLowerCase().includes(q);
          const matchVice = py.vicePrincipal?.name.toLowerCase().includes(q);
          const matchIn = py.transferredIn.some((t) => t.name.toLowerCase().includes(q));
          const matchOut = py.transferredOut.some((t) => t.name.toLowerCase().includes(q));
          return matchPrincipal || matchVice || matchIn || matchOut;
        });

        if (!matchesName && !matchesFormer && !matchesLocation && !matchesFounder && !matchesPersonnel) {
          return false;
        }
      }

      // Prefecture filter
      if (filters.prefecture && school.prefecture !== filters.prefecture) {
        return false;
      }

      // Municipality filter
      if (
        filters.municipality &&
        !school.municipality.toLowerCase().includes(filters.municipality.trim().toLowerCase())
      ) {
        return false;
      }

      // School type filter
      if (filters.schoolType && school.schoolType !== filters.schoolType) {
        return false;
      }

      // Fiscal year filter
      if (filters.fiscalYear) {
        const targetYear = parseInt(filters.fiscalYear, 10);
        const hasYear = school.personnelByYear.some((py) => py.fiscalYear === targetYear);
        if (school.latestConfirmedYear !== targetYear && !hasYear) {
          return false;
        }
      }

      return true;
    });
  }, [schools, filters]);

  // Sample autocomplete suggestions
  const sampleSuggestions = useMemo(() => {
    const list: { name: string; type: 'teacher' | 'school'; desc: string }[] = [];
    teachers.forEach((t) => {
      list.push({
        name: t.name,
        type: 'teacher',
        desc: `${t.prefecture} · ${t.currentSchoolName} (${t.currentPosition})`,
      });
    });
    schools.forEach((s) => {
      list.push({
        name: s.name,
        type: 'school',
        desc: `${s.prefecture} ${s.municipality} · ${s.schoolType}`,
      });
    });
    return list;
  }, [teachers, schools]);

  // Handlers for selection & navigation
  const handleQuickSearch = (query: string, type: 'all' | 'teacher' | 'school' = 'all') => {
    setFilters({
      ...filters,
      query,
      searchType: type,
    });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectSchoolById = (schoolId: string) => {
    const school = schools.find((s) => s.id === schoolId);
    if (school) {
      setSelectedSchool(school);
    }
  };

  const handleSelectTeacherById = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher) {
      setSelectedTeacher(teacher);
    }
  };

  const handleSelectPrefecture = (pref: string) => {
    setFilters({
      ...filters,
      prefecture: pref,
    });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectUpdate = (update: RecentGazetteUpdate) => {
    const prefMatch = update.issuer.match(/([^\s/]+?(?:都|道|府|県))/);
    const pref = prefMatch ? prefMatch[1] : '';
    setFilters({
      ...filters,
      prefecture: pref,
      fiscalYear: update.fiscalYear.toString(),
    });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavClick = (target: 'teachers' | 'schools' | 'updates' | 'regions' | 'about' | 'review') => {
    if (target === 'teachers') {
      setFilters((prev) => ({ ...prev, searchType: 'teacher' }));
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'schools') {
      setFilters((prev) => ({ ...prev, searchType: 'school' }));
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'updates') {
      updatesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'regions') {
      prefectureRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'about') {
      setIsAboutModalOpen(true);
    } else if (target === 'review') {
      setIsReviewModalOpen(true);
    }
  };

  // Review & Reversible Audit Handlers (Sections 21 & 22)
  const handleApproveObservation = (obsId: string) => {
    setObservations((prev) =>
      prev.map((o) =>
        o.id === obsId
          ? {
              ...o,
              reviewStatus: '承認済み',
              reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              reviewerNotes: '人間レビュアーによる本人照合完了・承認発令。',
            }
          : o
      )
    );

    const obs = observations.find((o) => o.id === obsId);
    if (obs) {
      const newLog: AuditLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        action: '承認',
        targetType: 'observation',
        targetId: obs.id,
        targetName: `${obs.extractedName} (${obs.extractedNewOrg})`,
        details: `公報抽出レコード ${obs.id} の同一性確認を完了し、公開タイムラインへ承認反映しました。`,
        reversible: true,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }
  };

  const handleSplitObservation = (obsId: string) => {
    const obs = observations.find((o) => o.id === obsId);
    if (!obs) return;

    setObservations((prev) =>
      prev.map((o) =>
        o.id === obsId
          ? {
              ...o,
              reviewStatus: '承認済み',
              assignedTeacherId: `tch-split-${Date.now()}`,
              reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              reviewerNotes: '同姓同名の別候補として新規人物IDへ分離割当。',
            }
          : o
      )
    );

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: '人物分離',
      targetType: 'observation',
      targetId: obs.id,
      targetName: `${obs.extractedName} (分離処理)`,
      details: `同姓同名候補との混同を防止するため、独立した人物IDへ分離しました。`,
      reversible: true,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleRejectObservation = (obsId: string) => {
    setObservations((prev) =>
      prev.map((o) =>
        o.id === obsId
          ? {
              ...o,
              reviewStatus: '却下',
              reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              reviewerNotes: '公報抽出行の重複または不整合により非公開除外。',
            }
          : o
      )
    );

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: '却下',
      targetType: 'observation',
      targetId: obsId,
      targetName: `観測レコード ${obsId}`,
      details: `公報抽出レコード ${obsId} を不整合のためアーカイブ対象から除外しました。`,
      reversible: true,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleRevertAuditLog = (logId: string) => {
    const log = auditLogs.find((l) => l.id === logId);
    if (!log) return;

    // Reset observation back to pending
    setObservations((prev) =>
      prev.map((o) =>
        o.id === log.targetId
          ? { ...o, reviewStatus: '確認中', reviewedAt: undefined, reviewerNotes: '監査ログ取消により要再照合' }
          : o
      )
    );

    const revertLog: AuditLogItem = {
      id: `log-revert-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: 'データ修正',
      targetType: log.targetType,
      targetId: log.targetId,
      targetName: log.targetName,
      details: `直前の操作「${log.action}: ${log.details}」を取り消し、確認中ステータスへロールバックしました。`,
      reversible: false,
    };
    setAuditLogs((prev) => [revertLog, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* 1. Header */}
      <Header onNavClick={handleNavClick} />

      {/* 2. Hero Search Area */}
      <HeroSearch
        filters={filters}
        onFilterChange={setFilters}
        onQuickSearch={handleQuickSearch}
        sampleSuggestions={sampleSuggestions}
      />

      {/* 3. Main Results Section */}
      <main className="flex-1" ref={resultsRef}>
        <SearchResults
          teachers={filteredTeachers}
          schools={filteredSchools}
          filters={filters}
          onFilterChange={setFilters}
          onSelectTeacher={setSelectedTeacher}
          onSelectSchoolById={handleSelectSchoolById}
          onSelectSchool={setSelectedSchool}
        />

        {/* 4. Prefecture Explorer Section */}
        <div ref={prefectureRef}>
          <PrefectureExplorer
            onSelectPrefecture={handleSelectPrefecture}
            schools={schools}
            teachers={teachers}
          />
        </div>

        {/* 5. Recent Gazette Updates Section */}
        <div ref={updatesRef}>
          <RecentUpdates
            updates={updates}
            onSelectUpdate={handleSelectUpdate}
          />
        </div>
      </main>

      {/* 6. Footer */}
      <Footer onNavClick={handleNavClick} />

      {/* MODALS */}
      {/* Teacher Profile & Career Timeline Modal */}
      <TeacherDetailModal
        teacher={selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        onSelectSchool={(schoolId) => {
          setSelectedTeacher(null);
          handleSelectSchoolById(schoolId);
        }}
        onSelectTeacherById={handleSelectTeacherById}
        onOpenSource={setSelectedSource}
        allTeachers={teachers}
      />

      {/* School Profile & Annual Personnel Roster Modal */}
      <SchoolDetailModal
        school={selectedSchool}
        onClose={() => setSelectedSchool(null)}
        onSelectTeacher={(teacherId) => {
          setSelectedSchool(null);
          handleSelectTeacherById(teacherId);
        }}
        onOpenSource={setSelectedSource}
      />

      {/* Official Source Inspector Modal */}
      <SourceDetailsModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />

      {/* Review & Reversible Audit Console Modal (Sections 21 & 22) */}
      <ReviewSystemModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        observations={observations}
        auditLogs={auditLogs}
        onApproveObservation={handleApproveObservation}
        onSplitObservation={handleSplitObservation}
        onRejectObservation={handleRejectObservation}
        onRevertAuditLog={handleRevertAuditLog}
      />

      {/* About & Privacy Ethics Modal */}
      <AboutArchiveModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
