/**
 * PrepNova Role & Resume/JD Section Recommendation Engine
 * Analyzes target role, parsed resume skills, and JD requirements
 * to recommend relevant interview practice sections without restricting user choice.
 */

import { INTERVIEW_SECTIONS_LIBRARY } from '../constants/sections';

export function getRecommendedSections({ role = '', resumeDoc = null, jdDoc = null } = {}) {
  const recommendedIds = new Set();
  const roleLower = String(role || '').toLowerCase();

  // Extract skills from resume
  const resumeSkills = [];
  try {
    const skillsObj = resumeDoc?.parsedData?.skills || resumeDoc?.skills;
    if (Array.isArray(skillsObj)) {
      skillsObj.forEach((s) => resumeSkills.push(String(s).toLowerCase()));
    } else if (typeof skillsObj === 'object' && skillsObj) {
      Object.values(skillsObj).forEach((val) => {
        if (Array.isArray(val)) val.forEach((s) => resumeSkills.push(String(s).toLowerCase()));
        else if (typeof val === 'string') resumeSkills.push(val.toLowerCase());
      });
    }
  } catch (_) { /* ignore */ }

  // Extract skills from JD
  const jdSkills = [];
  try {
    const jskills = jdDoc?.parsedData?.required_skills || jdDoc?.parsedData?.skills;
    if (Array.isArray(jskills)) {
      jskills.forEach((s) => jdSkills.push(String(s).toLowerCase()));
    }
  } catch (_) { /* ignore */ }

  const combinedContextText = `${roleLower} ${resumeSkills.join(' ')} ${jdSkills.join(' ')}`;

  // 1. Role Domain Mapping
  if (roleLower.includes('frontend') || roleLower.includes('front-end') || roleLower.includes('react') || roleLower.includes('web')) {
    recommendedIds.add('javascript');
    recommendedIds.add('react_frontend');
    recommendedIds.add('dsa');
    recommendedIds.add('scenario_based');
  }

  if (roleLower.includes('backend') || roleLower.includes('back-end') || roleLower.includes('node') || roleLower.includes('api')) {
    recommendedIds.add('nodejs_backend');
    recommendedIds.add('dbms_sql');
    recommendedIds.add('system_design');
    recommendedIds.add('scenario_based');
  }

  if (roleLower.includes('fullstack') || roleLower.includes('full-stack') || roleLower.includes('full stack')) {
    recommendedIds.add('fullstack_dev');
    recommendedIds.add('javascript');
    recommendedIds.add('react_frontend');
    recommendedIds.add('nodejs_backend');
    recommendedIds.add('dbms_sql');
    recommendedIds.add('scenario_based');
  }

  if (roleLower.includes('data') || roleLower.includes('ml') || roleLower.includes('ai') || roleLower.includes('machine learning') || roleLower.includes('llm')) {
    recommendedIds.add('ai_ml_llm_rag');
    recommendedIds.add('dbms_sql');
    recommendedIds.add('programming_oop');
    recommendedIds.add('scenario_based');
  }

  if (roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('sre') || roleLower.includes('infrastructure')) {
    recommendedIds.add('cloud_devops');
    recommendedIds.add('system_design');
    recommendedIds.add('computer_networks');
    recommendedIds.add('scenario_based');
  }

  if (roleLower.includes('security') || roleLower.includes('cyber') || roleLower.includes('secops')) {
    recommendedIds.add('cybersecurity');
    recommendedIds.add('computer_networks');
    recommendedIds.add('operating_systems');
    recommendedIds.add('scenario_based');
  }

  if (roleLower.includes('qa') || roleLower.includes('test') || roleLower.includes('quality')) {
    recommendedIds.add('software_testing');
    recommendedIds.add('programming_oop');
    recommendedIds.add('scenario_based');
  }

  if (roleLower.includes('java') || roleLower.includes('spring') || roleLower.includes('php') || roleLower.includes('laravel')) {
    recommendedIds.add('java_php_laravel_spring');
    recommendedIds.add('programming_oop');
    recommendedIds.add('dbms_sql');
  }

  // 2. Skill match from Resume & JD
  if (combinedContextText.includes('sql') || combinedContextText.includes('postgres') || combinedContextText.includes('mongo') || combinedContextText.includes('database')) {
    recommendedIds.add('dbms_sql');
  }
  if (combinedContextText.includes('docker') || combinedContextText.includes('kubernetes') || combinedContextText.includes('aws') || combinedContextText.includes('ci/cd')) {
    recommendedIds.add('cloud_devops');
  }
  if (combinedContextText.includes('system design') || combinedContextText.includes('microservices') || combinedContextText.includes('distributed')) {
    recommendedIds.add('system_design');
  }
  if (combinedContextText.includes('rag') || combinedContextText.includes('langchain') || combinedContextText.includes('openai') || combinedContextText.includes('vector')) {
    recommendedIds.add('ai_ml_llm_rag');
  }
  if (combinedContextText.includes('security') || combinedContextText.includes('owasp') || combinedContextText.includes('oauth')) {
    recommendedIds.add('cybersecurity');
  }

  // Fallback if nothing specific matched
  if (recommendedIds.size === 0) {
    recommendedIds.add('programming_oop');
    recommendedIds.add('dsa');
    recommendedIds.add('dbms_sql');
    recommendedIds.add('scenario_based');
    recommendedIds.add('general_hr');
  }

  // Always suggest scenario-based questions if size is small
  if (!recommendedIds.has('scenario_based') && recommendedIds.size <= 3) {
    recommendedIds.add('scenario_based');
  }

  const resultIds = Array.from(recommendedIds);
  const resultSections = INTERVIEW_SECTIONS_LIBRARY.filter((s) => resultIds.includes(s.id));

  return {
    recommendedIds: resultIds,
    recommendedSections: resultSections,
    basisLabel: role ? `Target Role (${role})` : (resumeSkills.length ? 'Uploaded Resume Skills' : 'Core Engineering Benchmark')
  };
}

