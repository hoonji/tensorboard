/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {GroupByKey} from '../types';
import {buildRun} from './testing';
import {createGroupBy, groupRuns} from './utils';

describe('run store utils test', () => {
  describe('#groupRuns', () => {
    describe('by runs', () => {
      it('groups runs by run ids', () => {
        const actual = groupRuns(
          {key: GroupByKey.RUN},
          [
            buildRun({id: 'eid1/alpha', name: 'alpha'}),
            buildRun({id: 'eid1/beta', name: 'beta'}),
            buildRun({id: 'eid2/beta', name: 'beta'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
          }
        );

        expect(actual.matches).toEqual({
          'eid1/alpha': [buildRun({id: 'eid1/alpha', name: 'alpha'})],
          'eid1/beta': [buildRun({id: 'eid1/beta', name: 'beta'})],
          'eid2/beta': [buildRun({id: 'eid2/beta', name: 'beta'})],
          'eid2/gamma': [buildRun({id: 'eid2/gamma', name: 'gamma'})],
        });
      });
    });

    describe('by experiment', () => {
      it('groups runs by experiment ids', () => {
        const actual = groupRuns(
          {key: GroupByKey.EXPERIMENT},
          [
            buildRun({id: 'eid1/alpha', name: 'alpha'}),
            buildRun({id: 'eid1/beta', name: 'beta'}),
            buildRun({id: 'eid2/beta', name: 'beta'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
          }
        );

        expect(actual.matches).toEqual({
          eid1: [
            buildRun({id: 'eid1/alpha', name: 'alpha'}),
            buildRun({id: 'eid1/beta', name: 'beta'}),
          ],
          eid2: [
            buildRun({id: 'eid2/beta', name: 'beta'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
        });
      });
    });

    describe('by run regex', () => {
      it('does not group when the regex is empty ', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX, regexString: ''},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
          }
        );
        expect(actual).toEqual({
          matches: {},
          nonMatches: [],
        });
      });

      it('does not group when the regex is invalid', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX, regexString: 'foo\\d+)bar'},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
          }
        );
        expect(actual).toEqual({
          matches: {},
          nonMatches: [],
        });
      });

      it('groups runs by regex without capture group', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX, regexString: 'foo\\d+bar'},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
          }
        );

        expect(actual).toEqual({
          matches: {
            pseudo_group: [
              buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
              buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
              buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            ],
          },
          nonMatches: [buildRun({id: 'eid2/gamma', name: 'gamma'})],
        });
      });

      it('groups runs by regex with one capture group', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX, regexString: 'foo(\\d+)bar.*'},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'foo2bar3'}),
            buildRun({id: 'eid2/alpha', name: 'alpha'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
            'eid2/alpha': 'eid2',
          }
        );

        expect(actual).toEqual({
          matches: {
            '["1"]': [
              buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
              buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            ],
            '["2"]': [
              buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
              buildRun({id: 'eid2/gamma', name: 'foo2bar3'}),
            ],
          },
          nonMatches: [buildRun({id: 'eid2/alpha', name: 'alpha'})],
        });
      });

      it('groups runs by regex with multiple capture group', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX, regexString: 'foo(\\d+)bar(\\d+).*'},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar2'}),
            buildRun({id: 'eid2/gamma', name: 'foo2bar2bar'}),
            buildRun({id: 'eid2/alpha', name: 'alpha'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
            'eid2/alpha': 'eid2',
          }
        );

        expect(actual).toEqual({
          matches: {
            '["1","1"]': [buildRun({id: 'eid1/alpha', name: 'foo1bar1'})],
            '["2","1"]': [buildRun({id: 'eid1/beta', name: 'foo2bar1'})],
            '["2","2"]': [
              buildRun({id: 'eid2/beta', name: 'foo2bar2'}),
              buildRun({id: 'eid2/gamma', name: 'foo2bar2bar'}),
            ],
          },
          nonMatches: [buildRun({id: 'eid2/alpha', name: 'alpha'})],
        });
      });
    });

    describe('by experiment regex', () => {
      it('does not group when run id to experiment map is not provided', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX_BY_EXP, regexString: 'foo'},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
          }
        );
        expect(actual).toEqual({
          matches: {},
          nonMatches: [],
        });
      });

      it('does not group when regex is empty', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX_BY_EXP, regexString: ''},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
          },
          {
            eid1: 'experiment1',
            eid2: 'expiriment2',
          }
        );
        expect(actual).toEqual({
          matches: {},
          nonMatches: [],
        });
      });

      it('does not group when regex is invalid', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX_BY_EXP, regexString: 'foo\\d+)bar'},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
          },
          {
            eid1: 'experiment1',
            eid2: 'expiriment2',
          }
        );
        expect(actual).toEqual({
          matches: {},
          nonMatches: [],
        });
      });

      it('does not group if no experiment names are provided', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX_BY_EXP, regexString: 'foo\\d+)bar'},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
          },
          {}
        );
        expect(actual).toEqual({
          matches: {},
          nonMatches: [],
        });
      });

      it('groups run by regex without capture group', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX_BY_EXP, regexString: 'foo'},
          [
            buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
            buildRun({id: 'eid3/theta', name: 'theta'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
            'eid3/theta': 'eid3',
          },
          {
            eid1: 'foobar',
            eid2: 'bar',
            eid3: 'foodoo',
          }
        );

        expect(actual).toEqual({
          matches: {
            pseudo_group: [
              buildRun({id: 'eid1/alpha', name: 'foo1bar1'}),
              buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
              buildRun({id: 'eid3/theta', name: 'theta'}),
            ],
          },
          nonMatches: [
            buildRun({id: 'eid2/beta', name: 'foo2bar1'}),
            buildRun({id: 'eid2/gamma', name: 'gamma'}),
          ],
        });
      });

      it('groups run by regex with one capture group', () => {
        const actual = groupRuns(
          {key: GroupByKey.REGEX_BY_EXP, regexString: 'foo(\\d+)bar.*'},
          [
            buildRun({id: 'eid1/alpha', name: 'alpha'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'gamma'}),
            buildRun({id: 'eid2/gamma', name: 'foo2bar3'}),
            buildRun({id: 'eid3/alpha', name: 'theta'}),
            buildRun({id: 'eid4/gamma', name: 'foo3bar'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
            'eid3/alpha': 'eid3',
            'eid4/gamma': 'eid4',
          },
          {
            eid1: 'foo1bar',
            eid2: 'foo2bar',
            eid3: 'foo1bar',
            eid4: 'theta',
          }
        );

        expect(actual).toEqual({
          matches: {
            '["1"]': [
              buildRun({id: 'eid1/alpha', name: 'alpha'}),
              buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
              buildRun({id: 'eid3/alpha', name: 'theta'}),
            ],
            '["2"]': [
              buildRun({id: 'eid2/beta', name: 'gamma'}),
              buildRun({id: 'eid2/gamma', name: 'foo2bar3'}),
            ],
          },
          nonMatches: [buildRun({id: 'eid4/gamma', name: 'foo3bar'})],
        });
      });

      it('groups run by regex with multiple capture groups', () => {
        // TODO
        const actual = groupRuns(
          {key: GroupByKey.REGEX_BY_EXP, regexString: 'foo(\\d+)bar(\\d+).*'},
          [
            buildRun({id: 'eid1/alpha', name: 'alpha'}),
            buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            buildRun({id: 'eid2/beta', name: 'gamma'}),
            buildRun({id: 'eid2/gamma', name: 'foo2bar3'}),
            buildRun({id: 'eid3/alpha', name: 'theta'}),
            buildRun({id: 'eid4/gamma', name: 'foo3bar'}),
          ],
          {
            'eid1/alpha': 'eid1',
            'eid1/beta': 'eid1',
            'eid2/beta': 'eid2',
            'eid2/gamma': 'eid2',
            'eid3/alpha': 'eid3',
            'eid4/gamma': 'eid4',
          },
          {
            eid1: 'foo1bar1',
            eid2: 'foo2bar1',
            eid3: 'foo1bar2',
            eid4: 'theta',
          }
        );

        expect(actual).toEqual({
          matches: {
            '["1","1"]': [
              buildRun({id: 'eid1/alpha', name: 'alpha'}),
              buildRun({id: 'eid1/beta', name: 'foo1bar2'}),
            ],
            '["2","1"]': [
              buildRun({id: 'eid2/beta', name: 'gamma'}),
              buildRun({id: 'eid2/gamma', name: 'foo2bar3'}),
            ],
            '["1","2"]': [buildRun({id: 'eid3/alpha', name: 'theta'})],
          },
          nonMatches: [buildRun({id: 'eid4/gamma', name: 'foo3bar'})],
        });
      });
    });
  });

  describe('creatGroupBy', () => {
    it('groups by run', () => {
      const actual = createGroupBy(GroupByKey.RUN);

      expect(actual).toEqual({key: GroupByKey.RUN});
    });

    it('groups by experiment', () => {
      const actual = createGroupBy(GroupByKey.EXPERIMENT);

      expect(actual).toEqual({key: GroupByKey.EXPERIMENT});
    });

    it('groups by run name regex', () => {
      const actual = createGroupBy(GroupByKey.REGEX, 'hello');

      expect(actual).toEqual({key: GroupByKey.REGEX, regexString: 'hello'});
    });

    it('groups by regex without regexString', () => {
      const actual = createGroupBy(GroupByKey.REGEX);

      expect(actual).toEqual({key: GroupByKey.REGEX, regexString: ''});
    });

    it('groups by experiment name regex', () => {
      const actual = createGroupBy(GroupByKey.REGEX_BY_EXP, 'world');

      expect(actual).toEqual({
        key: GroupByKey.REGEX_BY_EXP,
        regexString: 'world',
      });
    });
  });
});
